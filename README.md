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

`npm run start` inicia o servidor Expo normalmente. Como este projeto usa Google Sign-In nativo, o fluxo completo de autenticacao deve ser testado em um Development Build.

Para deixar explicito o alvo de execucao:

```bash
npm run start:go
npm run start:dev-client
```

No Expo Go, o app pode abrir para navegacao basica, mas o login com Google fica desativado.

Para gerar um Development Build:

```bash
npx expo install expo-dev-client
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```

## Configuração obrigatória

Preencha as variáveis em `.env`:

- URL da API;
- modo do login Google em `EXPO_PUBLIC_GOOGLE_AUTH_MODE` (`native`, `authsession` ou `disabled`);
- client IDs OAuth e URL Scheme do Google;
- chaves do Google Maps;
- ID do projeto EAS.

Se voce usar `EXPO_PUBLIC_GOOGLE_AUTH_MODE=authsession`, o login Google passa a usar navegador via `expo-auth-session`. Isso nao libera testes OAuth no Expo Go: a documentacao oficial do Expo informa que o Expo Go nao suporta esse fluxo localmente, entao o caminho continua sendo usar Development Build ou desativar o Google durante o desenvolvimento.

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
