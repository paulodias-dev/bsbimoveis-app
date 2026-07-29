export interface PasswordRequirement {
  id: 'length' | 'lowercase' | 'uppercase' | 'number' | 'symbol';
  label: string;
  test: (password: string) => boolean;
}

export const passwordRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: '8 caracteres',
    test: (password) => password.length >= 8,
  },
  {
    id: 'lowercase',
    label: '1 letra minúscula',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'uppercase',
    label: '1 letra maiúscula',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'number',
    label: '1 número',
    test: (password) => /\d/.test(password),
  },
  {
    id: 'symbol',
    label: '1 símbolo',
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export function getPasswordRequirementState(password: string) {
  return passwordRequirements.map((requirement) => ({
    ...requirement,
    met: requirement.test(password),
  }));
}

export function isStrongPassword(password: string) {
  return getPasswordRequirementState(password).every((item) => item.met);
}

export function getPasswordStrengthMeta(password: string) {
  const metCount = getPasswordRequirementState(password).filter((item) => item.met).length;

  if (metCount >= 5) {
    return {
      label: 'Senha forte',
      tone: 'strong' as const,
      progress: 1,
    };
  }

  if (metCount >= 3) {
    return {
      label: 'Senha média',
      tone: 'medium' as const,
      progress: 0.66,
    };
  }

  if (metCount >= 1) {
    return {
      label: 'Senha fraca',
      tone: 'weak' as const,
      progress: 0.33,
    };
  }

  return {
    label: 'Defina uma senha segura',
    tone: 'neutral' as const,
    progress: 0.12,
  };
}
