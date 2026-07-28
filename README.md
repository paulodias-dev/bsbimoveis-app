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

Para gerar um Development Build:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```

## Configuração obrigatória

Preencha as variáveis em `.env`:

- URL da API;
- client IDs OAuth e URL Scheme do Google;
- chaves do Google Maps;
- ID do projeto EAS.

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
