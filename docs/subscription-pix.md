# Assinatura e PIX

## Dados

- `GET /subscription` carrega a assinatura vigente;
- `GET /plans` carrega os planos públicos;
- os planos ativos, gratuitos ou padrão são exibidos em ordem de preço.

## Pagamento PIX

- `POST /payments/pix` recebe plano, pagador e documento;
- cada requisição utiliza uma chave `X-Idempotency-Key` gerada pelo `expo-crypto`;
- o QR Code é exibido pelo base64 retornado pela API;
- o código copia e cola pode ser copiado com `expo-clipboard` ou compartilhado pelo menu nativo;
- o ticket externo é aberto pelo `Linking`.

## Cartão

O cartão continua reservado para uma ponte nativa do Mercado Pago. O aplicativo não coleta dados sensíveis em WebView e não envia números de cartão diretamente à API.
