import { Controller, useFormContext, type FieldPath } from 'react-hook-form';
import { TextField } from '@/components/ui/TextField';
import type { PropertyFormValues } from './schema';

interface FormTextFieldProps {
  name: FieldPath<PropertyFormValues>;
  label: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  onBlurValue?: (value: string) => void;
}

export function FormTextField({
  name,
  label,
  placeholder,
  hint,
  multiline,
  numberOfLines,
  keyboardType,
  autoCapitalize,
  onBlurValue,
}: FormTextFieldProps) {
  const { control } = useFormContext<PropertyFormValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <TextField
          label={label}
          value={typeof value === 'string' ? value : ''}
          placeholder={placeholder}
          hint={hint}
          error={error?.message}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={multiline ? { minHeight: 120, paddingTop: 14 } : undefined}
          onChangeText={onChange}
          onBlur={() => {
            onBlur();
            onBlurValue?.(typeof value === 'string' ? value : '');
          }}
        />
      )}
    />
  );
}
