import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';

export default function Screen() {
  return (
    <FeaturePlaceholder
      eyebrow="Conta"
      title="Segurança"
      description="Alteração de senha e proteção da conta."
      currentBehavior="A rota será conectada ao endpoint `/profile/password` com visualização segura dos campos."
    />
  );
}
