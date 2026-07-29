# BSB Imóveis App

Aplicativo mobile multiplataforma do Portal BSB Imóveis, construído com React Native, Expo SDK 57 e Expo Router.

## Status desta entrega

A fundação já contém:

- navegação pública e protegida;
- autenticação por e-mail e Google Sign-In nativo;
- sessão persistida com SecureStore;
- renovação automática do token;
- cliente HTTP conectado à API atual;
- home com imóveis recentes;
- busca por cidade e finalidade;
- mapa por viewport com geolocalização;
- detalhes do imóvel e favoritos;
- dashboard e carteira do anunciante;
- rotas preparadas para os demais módulos do painel.

## Requisitos

- Node.js 22 LTS;
- npm;
- Android Studio para Android local;
- macOS e Xcode para iOS local;
- conta Expo para EAS Build.

## Instalação

```bash
npm install
cp .env.example .env
npm run start
```

`npm run start` inicia o Metro no fluxo padrao do `Expo Go`.

Este projeto foi ajustado para abrir no `Expo Go` com `Expo SDK 54`. O login Google continua tendo limitacoes no `Expo Go`, porque os fluxos OAuth locais e o SDK nativo do Google exigem recursos fora do sandbox do app.

Para deixar explicito o alvo de execucao:

```bash
npm run start:go
npm run start:tunnel
npm run start:dev-client
npm run start:dev-client:tunnel
```

Use `npm run start:tunnel` quando o celular nao estiver conseguindo acessar o IP local do computador pela mesma rede.

No `Expo Go`, o fluxo recomendado e testar navegacao, listagens, busca, mapas, favoritos e autenticacao por e-mail e senha. Para evitar bloqueios, deixe `EXPO_PUBLIC_GOOGLE_AUTH_MODE=disabled` no `.env`.

Para testar recursos nativos que nao cabem no Expo Go, gere um `Development Build`:

```bash
npx eas-cli@latest login
npm run build:dev:android
npm run build:dev:ios
```

Para simulador iOS:

```bash
npm run build:simulator:ios
```

Depois de instalar o build no aparelho ou simulador:

```bash
npm run start
```

Escaneie o QR code com o app de `Development Build` instalado no dispositivo.

## Configuração obrigatória

Preencha as variáveis em `.env`:

- URL da API;
- modo do login Google em `EXPO_PUBLIC_GOOGLE_AUTH_MODE` (`native`, `authsession` ou `disabled`);
- client IDs OAuth e URL Scheme do Google;
- chaves do Google Maps;
- ID do projeto EAS.

Se voce usar `EXPO_PUBLIC_GOOGLE_AUTH_MODE=authsession`, o login Google passa a usar navegador via `expo-auth-session`. Isso nao libera testes OAuth no Expo Go: a documentacao oficial do Expo informa que o Expo Go nao suporta esse fluxo localmente, entao o caminho continua sendo usar `Development Build` ou desativar o Google durante o desenvolvimento.

O backend atual recebe o `access_token` Google em `POST /auth/social`. A evolução recomendada é aceitar `id_token` ou `server_auth_code` validado no servidor.

## Estrutura

```text
app/                  rotas Expo Router
src/components/       componentes reutilizáveis
src/features/         módulos de negócio
src/providers/        providers globais
src/services/         API e persistência
src/stores/           estado local/global
src/theme/            tokens visuais
src/types/            contratos da API
```

## Próximas entregas

1. wizard completo de cadastro e edição do imóvel;
2. upload, recorte e reordenação de fotos;
3. perfil e segurança;
4. assinatura, PIX e ponte nativa Mercado Pago;
5. indicações, gráficos e regressão funcional.
