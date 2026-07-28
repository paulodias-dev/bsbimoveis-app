import { z } from 'zod';
import type { UserProfile } from './profileService';

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.'),
  phone: z.string().trim().max(30, 'Telefone muito longo.'),
  whatsapp: z.string().trim().max(30, 'WhatsApp muito longo.'),
  company_name: z.string().trim().max(150, 'Nome da empresa muito longo.'),
  company_website: z
    .string()
    .trim()
    .max(255, 'Website muito longo.')
    .refine(
      (value) => value === '' || /^https?:\/\//i.test(value),
      'Informe a URL completa iniciando com http:// ou https://.',
    ),
  bio: z.string().trim().max(1000, 'A bio deve ter no máximo 1.000 caracteres.'),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export function profileDefaults(profile: UserProfile): ProfileFormValues {
  return {
    name: profile.name,
    phone: profile.phone ?? '',
    whatsapp: profile.whatsapp ?? '',
    company_name: profile.company_name ?? '',
    company_website: profile.company_website ?? '',
    bio: profile.bio ?? '',
  };
}
