const GOOGLE_TRANSLATE_ENDPOINT = "https://translate.googleapis.com/translate_a/single";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "TRANSLATE_TEXT") {
    return false;
  }

  translateText(message.text, message.targetLanguage)
    .then((translatedText) => sendResponse({ ok: true, translatedText }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});

async function translateText(text, targetLanguage) {
  const cleanText = String(text || "").trim();
  const target = String(targetLanguage || "pt").trim();

  if (!cleanText) {
    return "";
  }

  const params = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: target,
    dt: "t",
    q: cleanText
  });

  const response = await fetch(`${GOOGLE_TRANSLATE_ENDPOINT}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Falha na tradução: HTTP ${response.status}`);
  }

  const data = await response.json();
  const translated = Array.isArray(data?.[0])
    ? data[0].map((segment) => segment?.[0] || "").join("")
    : "";

  if (!translated) {
    throw new Error("O serviço de tradução não retornou texto.");
  }

  return translated;
}
