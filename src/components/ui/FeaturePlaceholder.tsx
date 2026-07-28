import { Card } from './Card';
import { PageHeader } from './PageHeader';
import { Screen } from './Screen';
import { StateView } from './StateView';

interface FeaturePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  currentBehavior: string;
}

export function FeaturePlaceholder({
  eyebrow,
  title,
  description,
  currentBehavior,
}: FeaturePlaceholderProps) {
  return (
    <Screen>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <Card>
        <StateView
          title="Módulo preparado para migração"
          description={currentBehavior}
        />
      </Card>
    </Screen>
  );
}
