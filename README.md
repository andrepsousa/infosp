# infosp

PWA de utilidade p�blica para S�o Paulo: clima local, situa��o de metr� e trens, esta��es e mapas, favoritas e not�cias. N�o h� consulta ao saldo do Bilhete �nico nesta vers�o; essa fun��o depende de uma integra��o pr�pria a ser validada em aplicativos para iOS e Android.

## Desenvolvimento

Requer Node.js 22.13 ou superior. Execute `npm ci` e `npm run dev`. Confira a compila��o com `npm run build`.

As prefer�ncias e o nome s�o guardados no navegador; os dados externos s�o consultados em fontes descritas no c�digo. A imagem de rede � do mapa oficial STM/Metr� e mant�m indica��o de fonte no app. O arquivo `.openai/hosting.json` identifica a implanta��o atual no Sites.
