# BSB Imóveis App

Aplicativo mobile multiplataforma do Portal BSB Imóveis, construído com React Native, Expo SDK 57 e Expo Router.

## Status desta entrega

A aplicação já contém:

- navegação pública e painel protegido;
- autenticação por e-mail e Google;
- sessão persistida com SecureStore;
- renovação automática do token;
- cliente HTTP conectado à API atual;
- home, busca, mapa e detalhes dos imóveis;
- favoritos;
- dashboard premium do anunciante;
- cadastro e edição de imóveis;
- perfil, avatar e segurança;
- assinatura, planos e pagamento PIX;
- desempenho, indicações e oportunidades.

## Requisitos

- Node.js 22 LTS;
- npm;
- **JDK 17 para compilação Android local**;
- Android Studio para Android local;
- macOS e Xcode para iOS local;
- conta Expo para EAS Build.

> O JDK 25 pode continuar instalado no computador, mas não deve ser o Java usado pelo Gradle deste projeto. O arquivo `.java-version` declara Java 17 e `npm run android` executa uma verificação automática antes do build.

## Configurando o JDK 17

### Ubuntu e distribuições derivadas

```bash
sudo apt update
sudo apt install openjdk-17-jdk

export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH="$JAVA_HOME/bin:$PATH"
hash -r

java -version
npm run java:check
```

Para manter a configuração após reiniciar o terminal, adicione ao `~/.bashrc` ou `~/.zshrc`:

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH="$JAVA_HOME/bin:$PATH"
```

Depois recarregue o shell:

```bash
source ~/.bashrc
```

### Android Studio

Em **Settings > Build, Execution, Deployment > Build Tools > Gradle**, selecione um **Gradle JDK 17**. O JDK configurado no Android Studio pode ser diferente do Java padrão do sistema.

### Verificação

```bash
java -version
npm run java:check
```

A saída esperada é semelhante a:

```text
openjdk version "17.x.x"
✅ Java 17 detectado. Ambiente Android compatível.
```

## Instalação

```bash
npm install
cp .env.example .env
npm run start
```

`npm run start` inicia o servidor Expo normalmente. Como este projeto usa módulos nativos, o fluxo completo deve ser testado em um Development Build.

Para deixar explícito o alvo de execução:

```bash
npm run start:go
npm run start:dev-client
```

No Expo Go, o app pode abrir para navegação básica, mas módulos nativos como o login Google podem ficar indisponíveis.

## Executando no Android

Com o emulador ou dispositivo conectado:

```bash
npm run java:check
npm run android
```

Para recriar o projeto Android nativo:

```bash
npm run android:prebuild
npm run android
```

Caso o diretório `android/` tenha sido gerado anteriormente usando outro JDK e o Gradle continue reaproveitando processos antigos:

```bash
cd android
./gradlew --stop
cd ..
rm -rf android/.gradle
npm run android
```

## Development Build com EAS

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```

O EAS Build usa a imagem oficial do Expo SDK 57 com JDK 17, independentemente do JDK padrão instalado localmente.

## Configuração obrigatória

Preencha as variáveis em `.env`:

- URL da API;
- modo do login Google em `EXPO_PUBLIC_GOOGLE_AUTH_MODE` (`native`, `authsession` ou `disabled`);
- client IDs OAuth e URL Scheme do Google;
- chaves do Google Maps;
- ID do projeto EAS.

Se você usar `EXPO_PUBLIC_GOOGLE_AUTH_MODE=authsession`, o login Google utiliza o navegador via `expo-auth-session`. Para testar os recursos nativos, use um Development Build.

O backend atual recebe o `access_token` Google em `POST /auth/social`. A evolução recomendada é aceitar `id_token` ou `server_auth_code` validado no servidor.

## Estrutura

```text
app/                  rotas Expo Router
scripts/              verificações do ambiente local
src/components/       componentes reutilizáveis
src/features/         módulos de negócio
src/providers/        providers globais
src/services/         API e persistência
src/stores/           estado local/global
src/theme/            tokens visuais
src/types/            contratos da API
```
