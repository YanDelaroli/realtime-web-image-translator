const DEFAULT_SETTINGS = {
  enabled: true,
  targetLanguage: "pt"
};

const processedImages = new WeakSet();
const activeOverlays = new Map();
let settings = { ...DEFAULT_SETTINGS };
let observer;

initialize();

async function initialize() {
  settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  scanImages();
  observePage();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") return;

    if (changes.enabled) settings.enabled = changes.enabled.newValue;
    if (changes.targetLanguage) settings.targetLanguage = changes.targetLanguage.newValue;

    if (!settings.enabled) {
      clearAllOverlays();
      return;
    }

    document.querySelectorAll("img").forEach((image) => {
      processedImages.delete(image);
    });
    scanImages();
  });
}

function observePage() {
  observer = new MutationObserver((mutations) => {
    if (!settings.enabled) return;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;

        if (node.tagName === "IMG") queueImage(node);
        node.querySelectorAll?.("img").forEach(queueImage);
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

function scanImages() {
  if (!settings.enabled) return;
  document.querySelectorAll("img").forEach(queueImage);
}

function queueImage(image) {
  if (processedImages.has(image)) return;
  processedImages.add(image);

  const process = () => {
    window.setTimeout(() => processImage(image), 250);
  };

  if (image.complete) process();
  else image.addEventListener("load", process, { once: true });
}

async function processImage(image) {
  if (!settings.enabled || !image.isConnected) return;
  if (!isEligibleImage(image)) return;

  try {
    setImageStatus(image, "Lendo texto…");

    const result = await Tesseract.recognize(image, "eng+por+spa", {
      workerPath: chrome.runtime.getURL("vendor/worker.min.js"),
      corePath: chrome.runtime.getURL("vendor/tesseract-core.wasm.js"),
      langPath: chrome.runtime.getURL("vendor/lang-data")
    });

    const words = result?.data?.words || [];
    const meaningfulWords = words.filter((word) => {
      const text = String(word.text || "").trim();
      return text.length > 1 && Number(word.confidence || 0) >= 45;
    });

    if (!meaningfulWords.length) {
      removeImageStatus(image);
      return;
    }

    const groups = groupWordsIntoLines(meaningfulWords);
    const translatedGroups = [];

    for (const group of groups.slice(0, 30)) {
      const translatedText = await requestTranslation(group.text);
      if (translatedText && translatedText !== group.text) {
        translatedGroups.push({ ...group, translatedText });
      }
    }

    renderOverlay(image, translatedGroups, result.data.imageWidth, result.data.imageHeight);
    removeImageStatus(image);
  } catch (error) {
    console.warn("[Image Translator] Não foi possível processar a imagem:", error);
    setImageStatus(image, "Não foi possível traduzir", true);
    window.setTimeout(() => removeImageStatus(image), 2500);
  }
}

function isEligibleImage(image) {
  const rect = image.getBoundingClientRect();
  const source = image.currentSrc || image.src;

  return Boolean(
    source &&
    rect.width >= 160 &&
    rect.height >= 80 &&
    image.naturalWidth >= 160 &&
    image.naturalHeight >= 80 &&
    rect.bottom > 0 &&
    rect.top < window.innerHeight * 2
  );
}

function groupWordsIntoLines(words) {
  const sorted = [...words].sort((a, b) => {
    const verticalDifference = a.bbox.y0 - b.bbox.y0;
    return Math.abs(verticalDifference) > 10
      ? verticalDifference
      : a.bbox.x0 - b.bbox.x0;
  });

  const lines = [];

  for (const word of sorted) {
    const centerY = (word.bbox.y0 + word.bbox.y1) / 2;
    let line = lines.find((candidate) => {
      const tolerance = Math.max(12, candidate.height * 0.7);
      return Math.abs(candidate.centerY - centerY) <= tolerance;
    });

    if (!line) {
      line = {
        words: [],
        centerY,
        height: word.bbox.y1 - word.bbox.y0
      };
      lines.push(line);
    }

    line.words.push(word);
    line.centerY = (line.centerY + centerY) / 2;
    line.height = Math.max(line.height, word.bbox.y1 - word.bbox.y0);
  }

  return lines
    .map((line) => {
      line.words.sort((a, b) => a.bbox.x0 - b.bbox.x0);
      const first = line.words[0];
      const last = line.words[line.words.length - 1];
      const text = line.words.map((word) => word.text.trim()).join(" ").trim();

      return {
        text,
        bbox: {
          x0: first.bbox.x0,
          y0: Math.min(...line.words.map((word) => word.bbox.y0)),
          x1: last.bbox.x1,
          y1: Math.max(...line.words.map((word) => word.bbox.y1))
        }
      };
    })
    .filter((line) => line.text.length >= 2);
}

function requestTranslation(text) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "TRANSLATE_TEXT",
        text,
        targetLanguage: settings.targetLanguage
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response?.ok) {
          reject(new Error(response?.error || "Falha na tradução"));
          return;
        }

        resolve(response.translatedText);
      }
    );
  });
}

function renderOverlay(image, groups, sourceWidth, sourceHeight) {
  removeOverlay(image);
  if (!groups.length) return;

  const wrapper = document.createElement("div");
  wrapper.className = "rwit-overlay";
  document.documentElement.appendChild(wrapper);

  const updatePosition = () => {
    if (!image.isConnected || !wrapper.isConnected) {
      removeOverlay(image);
      return;
    }

    const rect = image.getBoundingClientRect();
    wrapper.style.left = `${window.scrollX + rect.left}px`;
    wrapper.style.top = `${window.scrollY + rect.top}px`;
    wrapper.style.width = `${rect.width}px`;
    wrapper.style.height = `${rect.height}px`;

    const scaleX = rect.width / sourceWidth;
    const scaleY = rect.height / sourceHeight;

    groups.forEach((group, index) => {
      const element = wrapper.children[index];
      if (!element) return;

      element.style.left = `${group.bbox.x0 * scaleX}px`;
      element.style.top = `${group.bbox.y0 * scaleY}px`;
      element.style.width = `${Math.max(40, (group.bbox.x1 - group.bbox.x0) * scaleX)}px`;
      element.style.minHeight = `${Math.max(18, (group.bbox.y1 - group.bbox.y0) * scaleY)}px`;
      element.style.fontSize = `${Math.max(11, Math.min(26, (group.bbox.y1 - group.bbox.y0) * scaleY * 0.85))}px`;
    });
  };

  for (const group of groups) {
    const block = document.createElement("span");
    block.className = "rwit-translation-block";
    block.textContent = group.translatedText;
    block.title = group.text;
    wrapper.appendChild(block);
  }

  const resizeObserver = new ResizeObserver(updatePosition);
  resizeObserver.observe(image);
  window.addEventListener("scroll", updatePosition, true);
  window.addEventListener("resize", updatePosition);

  activeOverlays.set(image, {
    wrapper,
    resizeObserver,
    updatePosition
  });

  updatePosition();
}

function removeOverlay(image) {
  const active = activeOverlays.get(image);
  if (!active) return;

  active.resizeObserver.disconnect();
  window.removeEventListener("scroll", active.updatePosition, true);
  window.removeEventListener("resize", active.updatePosition);
  active.wrapper.remove();
  activeOverlays.delete(image);
}

function clearAllOverlays() {
  [...activeOverlays.keys()].forEach(removeOverlay);
  document.querySelectorAll(".rwit-image-status").forEach((element) => element.remove());
}

function setImageStatus(image, text, error = false) {
  removeImageStatus(image);
  const rect = image.getBoundingClientRect();
  const status = document.createElement("span");
  status.className = `rwit-image-status${error ? " rwit-error" : ""}`;
  status.dataset.rwitFor = image.currentSrc || image.src;
  status.textContent = text;
  status.style.left = `${window.scrollX + rect.left + 8}px`;
  status.style.top = `${window.scrollY + rect.top + 8}px`;
  document.documentElement.appendChild(status);
  image.dataset.rwitStatusId = String(Date.now() + Math.random());
  status.dataset.rwitStatusId = image.dataset.rwitStatusId;
}

function removeImageStatus(image) {
  if (!image.dataset.rwitStatusId) return;
  const selector = `[data-rwit-status-id="${CSS.escape(image.dataset.rwitStatusId)}"]`;
  document.querySelector(selector)?.remove();
  delete image.dataset.rwitStatusId;
}
