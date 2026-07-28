import * as Clipboard from 'expo-clipboard';
import { Image, Linking, Share, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors, radius, spacing } from '@/theme/tokens';
import { formatCurrency } from '@/utils/format';
import type { PaymentResponse } from './subscriptionService';

interface PixPaymentResultProps {
  payment: PaymentResponse;
  onFeedback: (message: string, tone: 'success' | 'error') => void;
}

function qrImageUri(base64: string | null): string | null {
  if (!base64) return null;
  return base64.startsWith('data:image') ? base64 : `data:image/png;base64,${base64}`;
}

export function PixPaymentResult({ payment, onFeedback }: PixPaymentResultProps) {
  const pixCode = payment.pix.qr_code;
  const imageUri = qrImageUri(payment.pix.qr_code_base64);

  async function copyCode() {
    if (!pixCode) return;
    await Clipboard.setStringAsync(pixCode);
    onFeedback('Código PIX copiado para a área de transferência.', 'success');
  }

  async function shareCode() {
    if (!pixCode) return;
    try {
      await Share.share({
        title: 'Pagamento PIX BSB Imóveis',
        message: `Código PIX para pagamento do plano:\n\n${pixCode}`,
      });
    } catch {
      onFeedback('Não foi possível compartilhar o código PIX.', 'error');
    }
  }

  async function openTicket() {
    const url = payment.pix.ticket_url;
    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      onFeedback('O link de pagamento não pôde ser aberto.', 'error');
      return;
    }
    await Linking.openURL(url);
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>PIX GERADO</Text>
          <Text style={styles.title}>{formatCurrency(payment.amount)}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{payment.status.toUpperCase()}</Text>
        </View>
      </View>

      {imageUri ? (
        <View style={styles.qrShell}>
          <Image source={{ uri: imageUri }} style={styles.qrImage} resizeMode="contain" />
        </View>
      ) : null}

      {pixCode ? (
        <View style={styles.codeShell}>
          <Text style={styles.codeLabel}>PIX copia e cola</Text>
          <Text style={styles.code} selectable numberOfLines={5}>
            {pixCode}
          </Text>
        </View>
      ) : (
        <Text style={styles.warning}>
          O processador não retornou o código copia e cola. Use o link do pagamento.
        </Text>
      )}

      <View style={styles.actions}>
        <Button
          label="Copiar código"
          disabled={!pixCode}
          onPress={() => void copyCode()}
          style={styles.action}
        />
        <Button
          label="Compartilhar"
          variant="secondary"
          disabled={!pixCode}
          onPress={() => void shareCode()}
          style={styles.action}
        />
      </View>
      {payment.pix.ticket_url ? (
        <Button label="Abrir página do pagamento" variant="secondary" onPress={() => void openTicket()} />
      ) : null}
      <Text style={styles.order}>Pedido #{payment.order_id}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, borderColor: '#6CE9A6', backgroundColor: '#F6FEF9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: '#027A48', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: spacing.xs },
  statusBadge: {
    borderRadius: radius.pill,
    backgroundColor: '#D1FADF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  statusText: { color: '#027A48', fontSize: 10, fontWeight: '900' },
  qrShell: {
    width: 240,
    height: 240,
    alignSelf: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.white,
    padding: spacing.md,
  },
  qrImage: { width: '100%', height: '100%' },
  codeShell: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.xs,
  },
  codeLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  code: { color: colors.text, fontSize: 12, lineHeight: 17 },
  warning: { color: colors.warning, fontSize: 13, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1, paddingHorizontal: spacing.sm },
  order: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
});
