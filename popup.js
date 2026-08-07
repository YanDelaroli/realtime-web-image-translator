const enabledInput = document.querySelector("#enabled");
const targetLanguageSelect = document.querySelector("#targetLanguage");
const status = document.querySelector("#status");

initialize();

async function initialize() {
  const settings = await chrome.storage.sync.get({
    enabled: true,
    targetLanguage: "pt"
  });

  enabledInput.checked = settings.enabled;
  targetLanguageSelect.value = settings.targetLanguage;
}

enabledInput.addEventListener("change", async () => {
  await chrome.storage.sync.set({ enabled: enabledInput.checked });
  showSaved();
});

targetLanguageSelect.addEventListener("change", async () => {
  await chrome.storage.sync.set({
    targetLanguage: targetLanguageSelect.value
  });
  showSaved();
});

function showSaved() {
  status.textContent = "Configuração salva.";
  window.setTimeout(() => {
    status.textContent = "";
  }, 1400);
}
