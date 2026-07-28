import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing } from '@/theme/tokens';
import { getLegalDocument, legalHtmlToText, type LegalDocument } from './legalService';

interface TermsAgreementProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onVersionChange: (version: number | null) => void;
  error?: string;
}

export function TermsAgreement({
  checked,
  onChange,
  onVersionChange,
  error,
}: TermsAgreementProps) {
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const text = useMemo(() => legalHtmlToText(document?.content ?? ''), [document?.content]);

  useEffect(() => {
    let active = true;
    onChange(false);
    onVersionChange(null);
    setIsLoading(true);
    setLoadError(null);

    void getLegalDocument()
      .then((response) => {
        if (!active) return;
        setDocument(response.data);
        onVersionChange(response.data.version);
      })
      .catch(() => {
        if (active) setLoadError('Os Termos de Uso estão indisponíveis no momento.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [onChange, onVersionChange]);

  const disabled = isLoading || !document;

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        disabled={disabled}
        onPress={() => onChange(!checked)}
        style={styles.control}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked ? <Text style={styles.check}>✓</Text> : null}
        </View>
        <Text style={styles.label}>
          Li e concordo com os{' '}
          <Text style={styles.link} onPress={() => document && setIsOpen(true)}>
            Termos de Uso
          </Text>
          {document ? ` (versão ${document.version})` : ''}.
        </Text>
      </Pressable>

      {isLoading ? <Text style={styles.hint}>Carregando Termos de Uso...</Text> : null}
      {error || loadError ? <Text style={styles.error}>{error ?? loadError}</Text> : null}

      <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalKicker}>DOCUMENTO LEGAL</Text>
              <Text style={styles.modalTitle}>{document?.title ?? 'Termos de Uso'}</Text>
              <Text style={styles.modalVersion}>Versão {document?.version ?? '—'}</Text>
            </View>
            <Button label="Fechar" variant="secondary" onPress={() => setIsOpen(false)} />
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.legalText}>{text}</Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  control: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { borderColor: colors.brand, backgroundColor: colors.brand },
  check: { color: colors.white, fontWeight: '900' },
  label: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  link: { color: colors.brand, fontWeight: '800' },
  hint: { color: colors.textMuted, fontSize: 11 },
  error: { color: colors.danger, fontSize: 12, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalHeaderCopy: { flex: 1, gap: spacing.xs },
  modalKicker: { color: colors.brand, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  modalVersion: { color: colors.textMuted, fontSize: 12 },
  modalContent: { padding: spacing.lg, paddingBottom: 60 },
  legalText: { color: colors.text, fontSize: 14, lineHeight: 22 },
});
