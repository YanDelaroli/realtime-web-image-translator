# Real-time Web Image Translator

Extensão Chrome (Manifest V3) que detecta imagens em páginas da web, executa OCR no navegador, traduz o texto detectado e desenha uma sobreposição traduzida sobre a imagem original.

## Recursos

- observa imagens já carregadas e adicionadas dinamicamente;
- executa OCR localmente com Tesseract.js;
- reconhece inglês, português e espanhol;
- traduz usando o endpoint público do Google Translate;
- posiciona blocos traduzidos sobre a imagem;
- permite ativar/desativar a tradução pelo popup;
- permite escolher o idioma de destino.

## Preparar e instalar

Requer Node.js 18 ou mais recente somente para baixar as dependências locais do OCR.

```bash
git clone https://github.com/YanDelaroli/realtime-web-image-translator.git
cd realtime-web-image-translator
npm run prepare:ocr
```

Depois:

1. Abra `chrome://extensions`.
2. Ative **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `realtime-web-image-translator`.
5. Abra uma página com imagens contendo texto.

O comando `npm run prepare:ocr` baixa versões fixadas do Tesseract.js, do WebAssembly e dos modelos `eng`, `por` e `spa` para `vendor/`. Nenhum JavaScript remoto é executado pela extensão.

## Observações

- A primeira tradução pode demorar enquanto o mecanismo de OCR é inicializado.
- Imagens pequenas são ignoradas para reduzir processamento.
- Alguns sites bloqueiam o acesso aos pixels das imagens por CORS.
- O endpoint público de tradução pode impor limites e não possui garantia de disponibilidade.

## Estrutura

- `manifest.json`: configuração da extensão.
- `background.js`: comunicação com o serviço de tradução.
- `content.js`: detecção de imagens, OCR e sobreposição.
- `content.css`: estilos das traduções sobrepostas.
- `popup.html`, `popup.css`, `popup.js`: controles da extensão.
- `scripts/prepare-ocr.mjs`: baixa e valida as dependências locais do OCR.
- `vendor/`: arquivos locais gerados pelo comando de preparação.
