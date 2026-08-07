# Dependências locais do OCR

O Manifest V3 não permite executar JavaScript remoto. Antes de carregar a extensão no Chrome, adicione os arquivos do Tesseract.js nesta pasta.

## Arquivos esperados

```text
vendor/
├── tesseract.min.js
├── worker.min.js
├── tesseract-core.wasm.js
└── lang-data/
    ├── eng.traineddata.gz
    ├── por.traineddata.gz
    └── spa.traineddata.gz
```

Use uma versão compatível do pacote `tesseract.js` e dos dados de idioma `tessdata`.

Enquanto esses arquivos não estiverem presentes, o Chrome exibirá erro ao carregar `vendor/tesseract.min.js` e o OCR não funcionará.
