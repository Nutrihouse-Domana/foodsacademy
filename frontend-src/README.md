# Foods Academy Frontend Reconstruido

Esta pasta foi reconstruida a partir dos sourcemaps do build publicado em `../frontend`.

## Como executar

```bash
npm install
npm start
```

## Como gerar build

```bash
npm run build
```

Os arquivos em `src/` vieram de `static/js/main.084aa8ec.js.map` e `static/css/main.66cca806.css.map`. Os assets foram copiados do build com nomes limpos para `src/assets/`.

## PWA

O manifest e o service worker ficam em `public/` para serem incluidos no build pelo React Scripts. O app instalado se chama Foods Academy e abre em uma janela independente. Os icones de 180, 192 e 512 pixels em `public/icons/` derivam de `public/logo_novo.png`, preservando a proporcao da imagem em uma tela quadrada; o de 180 pixels atende ao atalho do iOS.

Publique o build no IIS usando HTTPS com certificado confiavel (localhost tambem permite desenvolvimento). A instalacao fica disponivel pelo menu do navegador; no iOS, use Compartilhar > Adicionar a Tela de Inicio. O React Router atual pressupoe publicacao na raiz do site.

O service worker guarda apenas `offline.html` e mostra essa pagina quando uma navegacao para uma tela do app falha por falta de conexao. Autenticacao LDAP, APIs, cursos, materiais e videos continuam dependendo do servidor. Ao alterar a pagina offline, incremente `CACHE_NAME` em `public/service-worker.js`; uma nova versao assume o controle quando as janelas da versao anterior forem fechadas.

Depois da publicacao, confira Manifest e Service Workers na aba Application do DevTools, instale o app e simule o modo Offline ao recarregar uma rota como `/home`. O botao Tentar novamente retoma a mesma rota quando a conexao voltar.
