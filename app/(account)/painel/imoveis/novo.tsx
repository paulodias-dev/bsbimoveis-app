import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing } from '@/theme/tokens';

const steps = [
  'Dados do imóvel',
  'Endereço e mapa',
  'Comodidades',
  'Fotos',
  'Revisar e publicar',
];

export default function NewPropertyScreen() {
  return (
    <Screen>
      <PageHeader
        eyebrow="Cadastro de imóvel"
        title="Novo anúncio"
        description="A rota e a arquitetura do wizard já estão preparadas. A implementação integral das cinco etapas será a próxima entrega."
      />

      <View style={styles.steps}>
        {steps.map((step, index) => (
          <Card key={step} style={styles.step}>
            <View style={styles.number}>
              <Text style={styles.numberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: {
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  number: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  numberText: {
    color: colors.brandDark,
    fontWeight: '900',
  },
  stepText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
});
