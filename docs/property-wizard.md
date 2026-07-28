# Wizard mobile de imóveis

Este incremento implementa o fluxo nativo de cadastro e edição em cinco etapas:

1. dados, finalidade, preço, categoria e características;
2. endereço, consulta de CEP, geocodificação e pino arrastável;
3. comodidades;
4. fotos, limite do plano, capa, exclusão e reordenação;
5. revisão e solicitação de publicação.

## Endpoints preservados

- `POST /properties`
- `PATCH /properties/{id}`
- `POST /properties/{id}/photos`
- `DELETE /properties/{id}/photos/{photoId}`
- `PATCH /properties/{id}/photos/order`
- `POST /properties/{id}/request-publication`
- `POST /geocoding/nominatim`
- `GET /property-categories`
- `GET /amenities`

O novo anúncio é salvo localmente no AsyncStorage após cada etapa confirmada e também é persistido na API. O rascunho local é removido depois que a publicação é solicitada.
