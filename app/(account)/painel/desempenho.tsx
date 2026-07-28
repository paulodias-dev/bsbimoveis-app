import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';

export default function Screen() {
  return (
    <FeaturePlaceholder
      eyebrow="Business intelligence"
      title="Desempenho"
      description="Indicadores e gráficos da carteira."
      currentBehavior="O frontend web calcula views, favoritos, qualidade e status localmente. A migração dos gráficos nativos será feita sem inventar dados."
    />
  );
}
