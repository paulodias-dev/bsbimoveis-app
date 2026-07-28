# Insights, indicações, mensagens e favoritos

## Indicações

- `GET /referrals/me` fornece campanha, cupom, métricas, benefícios e histórico;
- cupom e link podem ser copiados;
- o compartilhamento usa o menu nativo do sistema;
- nenhum dado de campanha é simulado.

## Desempenho

Os cálculos preservam as regras da versão web:

- soma de visualizações e favoritos;
- taxa de intenção;
- score de qualidade por texto, fotos, capa, localização, comodidades e preço;
- evolução em seis meses agrupada pela criação dos imóveis;
- mix de publicação;
- ranking por visualizações.

Os gráficos usam Views nativas para evitar uma dependência adicional.

## Mensagens

A API atual ainda não fornece chat. A tela destaca até seis anúncios com visualizações, mantendo o mesmo limite funcional do frontend web.

## Favoritos

A rota gerencial reutiliza os favoritos hidratados pelo store, exibe métricas e permite abrir ou remover cada imóvel.
