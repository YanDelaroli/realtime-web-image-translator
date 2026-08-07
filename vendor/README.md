# Dependências locais do OCR

Esta pasta é preenchida automaticamente pelo comando:

```bash
npm run prepare:ocr
```

O script baixa versões fixadas e compatíveis de:

- Tesseract.js 5.1.1;
- worker do Tesseract.js 5.1.1;
- tesseract.js-core 5.0.0 em WebAssembly;
- modelos `eng`, `por` e `spa` da coleção `4.0.0_best_int`.

Arquivos gerados:

```text
vendor/
├── tesseract.min.js
├── worker.min.js
├── tesseract-core.wasm.js
├── tesseract-core.wasm
└── lang-data/
    ├── eng.traineddata.gz
    ├── por.traineddata.gz
    └── spa.traineddata.gz
```

Os binários não são mantidos manualmente no código-fonte. Execute o comando de preparação antes de carregar a extensão no Chrome.
