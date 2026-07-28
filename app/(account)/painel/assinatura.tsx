import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';

export default function Screen() {
  return (
    <FeaturePlaceholder
      eyebrow="Operação"
      title="Assinatura e planos"
      description="Plano vigente, vagas e pagamentos."
      currentBehavior="PIX e cartão dependem da migração do checkout. O cartão exigirá integração nativa segura com o Mercado Pago."
    />
  );
}
