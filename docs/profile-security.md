# Perfil e segurança

## Perfil

- `GET /profile` carrega os dados atuais;
- `PATCH /profile` atualiza nome, telefone, WhatsApp, empresa, website e bio;
- o avatar é selecionado pela galeria com recorte quadrado;
- a imagem é redimensionada para 512×512 e salva como JPEG antes do upload multipart;
- após a atualização, `/auth/me` é consultado novamente para sincronizar a sessão segura.

## Segurança

- `PUT /profile/password` altera a senha;
- validação local exige senha atual, nova senha com pelo menos 8 caracteres e confirmação igual;
- cada campo possui controle independente para mostrar ou ocultar o conteúdo;
- os campos são limpos depois da alteração confirmada pela API.
