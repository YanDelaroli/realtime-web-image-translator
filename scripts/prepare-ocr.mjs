import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const files = [
  ["https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js", "vendor/tesseract.min.js"],
  ["https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/worker.min.js", "vendor/worker.min.js"],
  ["https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core.wasm.js", "vendor/tesseract-core.wasm.js"],
  ["https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core.wasm", "vendor/tesseract-core.wasm"],
  ["https://tessdata.projectnaptha.com/4.0.0_best_int/eng.traineddata.gz", "vendor/lang-data/eng.traineddata.gz"],
  ["https://tessdata.projectnaptha.com/4.0.0_best_int/por.traineddata.gz", "vendor/lang-data/por.traineddata.gz"],
  ["https://tessdata.projectnaptha.com/4.0.0_best_int/spa.traineddata.gz", "vendor/lang-data/spa.traineddata.gz"]
];

async function download(url, destination) {
  const output = resolve(destination);
  await mkdir(dirname(output), { recursive: true });

  const response = await fetch(url, {
    headers: { "user-agent": "realtime-web-image-translator-build" }
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar ${url}: HTTP ${response.status}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength < 1000) {
    throw new Error(`Arquivo inesperadamente pequeno: ${url}`);
  }

  await writeFile(output, bytes);
  console.log(`✓ ${destination} (${Math.round(bytes.byteLength / 1024)} KiB)`);
}

console.log("Preparando dependências locais do OCR…");
for (const [url, destination] of files) {
  await download(url, destination);
}
console.log("OCR preparado. Agora carregue a pasta do projeto em chrome://extensions.");
