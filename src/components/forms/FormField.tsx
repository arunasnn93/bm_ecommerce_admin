import { Input, type InputProps } from '@components/ui/Input';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

interface FormFieldProps<T extends FieldValues> extends Omit<InputProps, 'name'> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  helperText?: string;
}

function FormField<T extends FieldValues>({
  name,
  control,
  label,
  helperText,
  ...inputProps
}: FormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Input
          {...field}
          {...inputProps}
          label={label}
          error={error?.message}
          helperText={helperText}
        />
      )}
    />
  );
}

export { FormField };
export type { FormFieldProps };

