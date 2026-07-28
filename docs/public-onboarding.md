# Onboarding público mobile

## Anunciar imóvel

A rota pública `/anunciar` permite escolher o perfil:

- proprietário direto;
- corretor ou imobiliária;
- incorporadora ou construtora.

Usuários autenticados seguem para o wizard de imóveis. Novos usuários seguem para o cadastro com o perfil preservado e convertido para a role esperada pela API.

## Planos

A rota `/planos` carrega `GET /plans`, compara preço, limites, fotos, validade e destaque. O plano escolhido é preservado durante cadastro ou login e chega pré-selecionado em `/painel/assinatura`.

## Cadastro

- carrega a versão atual em `GET /legal-documents/terms-of-use`;
- exige aceite da versão realmente carregada;
- preserva perfil, plano, cupom e identificadores de rascunho;
- suporta cadastro por e-mail ou Google com o mesmo contexto;
- utiliza campos de senha com visualização controlada.

## Login

O login por e-mail ou Google preserva o destino solicitado e retorna para o cadastro do imóvel, assinatura selecionada ou painel.
