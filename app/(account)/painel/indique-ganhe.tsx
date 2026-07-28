import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';

export default function Screen() {
  return (
    <FeaturePlaceholder
      eyebrow="Indicações"
      title="Cupons e recompensas"
      description="Compartilhamento e histórico de indicações."
      currentBehavior="O módulo utilizará os endpoints existentes `/referrals/me` e `/referrals/validate-code`."
    />
  );
}
