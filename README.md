# Real-time Web Image Translator

Extensão Chrome (Manifest V3) que detecta imagens em páginas da web, executa OCR no navegador, traduz o texto detectado e desenha uma sobreposição traduzida sobre a imagem original.

## Estado atual

Primeira versão funcional (MVP):

- observa imagens já carregadas e adicionadas dinamicamente;
- executa OCR com Tesseract.js;
- traduz usando o endpoint público do Google Translate;
- posiciona blocos traduzidos sobre a imagem;
- permite ativar/desativar a tradução pelo popup;
- permite escolher o idioma de destino.

## Como instalar no Chrome

1. Baixe ou clone este repositório.
2. Abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta deste projeto.

## Observações

- A primeira tradução pode demorar porque o mecanismo de OCR precisa ser carregado.
- Imagens pequenas são ignoradas para reduzir processamento.
- Alguns sites bloqueiam o acesso aos pixels das imagens por CORS. Nesses casos, a extensão tentará processar apenas imagens compatíveis.
- O endpoint público de tradução pode impor limites. Uma futura versão poderá oferecer provedores configuráveis.

## Estrutura

- `manifest.json`: configuração da extensão.
- `background.js`: comunicação com o serviço de tradução.
- `content.js`: detecção de imagens, OCR e sobreposição.
- `content.css`: estilos das traduções sobrepostas.
- `popup.html`, `popup.css`, `popup.js`: controles da extensão.
