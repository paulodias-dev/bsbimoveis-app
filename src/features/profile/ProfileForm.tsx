import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/theme/tokens';
import { profileDefaults, profileSchema, type ProfileFormValues } from './profileSchema';
import { updateProfile, type UserProfile } from './profileService';

interface ProfileFormProps {
  profile: UserProfile;
  onUpdated: (profile: UserProfile) => Promise<void>;
  onFeedback: (message: string, tone: 'success' | 'error') => void;
}

export function ProfileForm({ profile, onUpdated, onFeedback }: ProfileFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileDefaults(profile),
  });

  const submit = handleSubmit(async (values) => {
    try {
      const response = await updateProfile({
        name: values.name.trim(),
        phone: values.phone.trim() || null,
        whatsapp: values.whatsapp.trim() || null,
        company_name: values.company_name.trim() || null,
        company_website: values.company_website.trim() || null,
        bio: values.bio.trim() || null,
      });
      reset(profileDefaults(response.data));
      await onUpdated(response.data);
      onFeedback('Perfil atualizado com sucesso.', 'success');
    } catch (error) {
      onFeedback(
        error instanceof Error ? error.message : 'Não foi possível atualizar o perfil.',
        'error',
      );
    }
  });

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Dados pessoais e profissionais</Text>
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <TextField
            label="Nome"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
            autoCapitalize="words"
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field, fieldState }) => (
          <TextField
            label="Telefone"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
            keyboardType="phone-pad"
          />
        )}
      />
      <Controller
        control={control}
        name="whatsapp"
        render={({ field, fieldState }) => (
          <TextField
            label="WhatsApp"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
            keyboardType="phone-pad"
          />
        )}
      />
      <Controller
        control={control}
        name="company_name"
        render={({ field, fieldState }) => (
          <TextField
            label="Empresa"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
            autoCapitalize="words"
          />
        )}
      />
      <Controller
        control={control}
        name="company_website"
        render={({ field, fieldState }) => (
          <TextField
            label="Website"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
            placeholder="https://suaempresa.com.br"
            autoCapitalize="none"
            keyboardType="url"
          />
        )}
      />
      <Controller
        control={control}
        name="bio"
        render={({ field, fieldState }) => (
          <TextField
            label="Bio"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={styles.bioInput}
          />
        )}
      />
      <Button
        label={isSubmitting ? 'Salvando...' : 'Salvar alterações'}
        loading={isSubmitting}
        onPress={() => void submit()}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  bioInput: { minHeight: 130, paddingTop: spacing.md },
});
