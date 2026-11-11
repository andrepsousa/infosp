# infosp

PWA de utilidade pública para São Paulo: clima local, situação de metrô e trens, estações e mapas, favoritas e notícias. Não há consulta ao saldo do Bilhete Único nesta versão; essa função depende de uma integração própria a ser validada em aplicativos para iOS e Android.

## Desenvolvimento

Requer Node.js 22.13 ou superior. Execute `npm ci` e `npm run dev`. Confira a compilação com `npm run build`.

As preferências e o nome são guardados no navegador; os dados externos são consultados em fontes descritas no código. A imagem de rede é do mapa oficial STM/Metrô e mantém indicação de fonte no app. O arquivo `.openai/hosting.json` identifica a implantação atual no Sites.
