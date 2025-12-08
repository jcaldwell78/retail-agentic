import {
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
  type ReactNode,
  type FormEvent,
} from 'react';
import { AlertCircle, CheckCircle, Info, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Validation Types
export type ValidationRule = {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'match' | 'custom';
  value?: string | number | RegExp;
  message: string;
  validate?: (value: string, formValues?: Record<string, string>) => boolean;
};

export type FieldConfig = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'textarea' | 'number';
  placeholder?: string;
  rules?: ValidationRule[];
  helpText?: string;
};

export type FieldError = {
  field: string;
  message: string;
};

export type ValidationState = 'idle' | 'valid' | 'invalid' | 'validating';

// Validation Functions
export const validators = {
  required: (value: string): boolean => value.trim().length > 0,
  email: (value: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  minLength: (value: string, length: number): boolean => value.length >= length,
  maxLength: (value: string, length: number): boolean => value.length <= length,
  pattern: (value: string, pattern: RegExp): boolean => pattern.test(value),
  phone: (value: string): boolean =>
    /^[\d\s\-+()]{10,}$/.test(value),
  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  password: (value: string): boolean =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value),
  creditCard: (value: string): boolean =>
    /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/.test(value),
  postalCode: (value: string): boolean =>
    /^\d{5}(-\d{4})?$/.test(value),
};

// Common validation rules
export const commonRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    type: 'required',
    message,
  }),
  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    type: 'email',
    message,
  }),
  minLength: (length: number, message?: string): ValidationRule => ({
    type: 'minLength',
    value: length,
    message: message || `Must be at least ${length} characters`,
  }),
  maxLength: (length: number, message?: string): ValidationRule => ({
    type: 'maxLength',
    value: length,
    message: message || `Must be no more than ${length} characters`,
  }),
  pattern: (pattern: RegExp, message: string): ValidationRule => ({
    type: 'pattern',
    value: pattern,
    message,
  }),
  match: (fieldName: string, message?: string): ValidationRule => ({
    type: 'match',
    value: fieldName,
    message: message || `Must match ${fieldName}`,
  }),
  password: (): ValidationRule => ({
    type: 'pattern',
    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  }),
  phone: (): ValidationRule => ({
    type: 'pattern',
    value: /^[\d\s\-+()]{10,}$/,
    message: 'Please enter a valid phone number',
  }),
};

// Validate a single field
export function validateField(
  value: string,
  rules: ValidationRule[],
  formValues?: Record<string, string>
): string | null {
  for (const rule of rules) {
    let isValid = true;

    switch (rule.type) {
      case 'required':
        isValid = validators.required(value);
        break;
      case 'email':
        isValid = !value || validators.email(value);
        break;
      case 'minLength':
        isValid = !value || validators.minLength(value, rule.value as number);
        break;
      case 'maxLength':
        isValid = validators.maxLength(value, rule.value as number);
        break;
      case 'pattern':
        isValid = !value || validators.pattern(value, rule.value as RegExp);
        break;
      case 'match':
        isValid = !formValues || value === formValues[rule.value as string];
        break;
      case 'custom':
        isValid = !rule.validate || rule.validate(value, formValues);
        break;
    }

    if (!isValid) {
      return rule.message;
    }
  }

  return null;
}

// Form Context
interface FormContextType {
  values: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  setValue: (name: string, value: string) => void;
  setTouched: (name: string) => void;
  validateField: (name: string) => string | null;
  validateForm: () => boolean;
  resetForm: () => void;
}

const FormContext = createContext<FormContextType | null>(null);

interface FormProviderProps {
  children: ReactNode;
  initialValues?: Record<string, string>;
  fieldConfigs: FieldConfig[];
  onSubmit?: (values: Record<string, string>) => void | Promise<void>;
}

/**
 * Form Provider - Manages form state and validation
 */
export function FormProvider({
  children,
  initialValues = {},
  fieldConfigs,
  onSubmit,
}: FormProviderProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouchedState] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && Object.keys(touched).length > 0;
  }, [errors, touched]);

  const setValue = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setTouched = useCallback((name: string) => {
    setTouchedState((prev) => ({ ...prev, [name]: true }));
  }, []);

  const validateFieldByName = useCallback(
    (name: string): string | null => {
      const config = fieldConfigs.find((f) => f.name === name);
      if (!config?.rules) return null;

      const error = validateField(values[name] || '', config.rules, values);
      setErrors((prev) => {
        if (error) {
          return { ...prev, [name]: error };
        }
        const { [name]: _, ...rest } = prev; // eslint-disable-line @typescript-eslint/no-unused-vars
        return rest;
      });
      return error;
    },
    [fieldConfigs, values]
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    for (const config of fieldConfigs) {
      newTouched[config.name] = true;
      if (config.rules) {
        const error = validateField(values[config.name] || '', config.rules, values);
        if (error) {
          newErrors[config.name] = error;
        }
      }
    }

    setTouchedState(newTouched);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fieldConfigs, values]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedState({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      setIsSubmitting(true);
      try {
        await onSubmit?.(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateForm, values, onSubmit]
  );

  return (
    <FormContext.Provider
      value={{
        values,
        errors,
        touched,
        isSubmitting,
        isValid,
        setValue,
        setTouched,
        validateField: validateFieldByName,
        validateForm,
        resetForm,
      }}
    >
      <form onSubmit={handleSubmit} noValidate data-testid="validated-form">
        {children}
      </form>
    </FormContext.Provider>
  );
}

/**
 * Hook to use form context
 */
export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
}

interface ValidatedInputProps {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';
  placeholder?: string;
  helpText?: string;
  className?: string;
  showPasswordToggle?: boolean;
  showValidIcon?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
}

/**
 * Validated Input - Input with inline validation
 */
export function ValidatedInput({
  name,
  label,
  type = 'text',
  placeholder,
  helpText,
  className,
  showPasswordToggle = false,
  showValidIcon = false,
  validateOnBlur = true,
  validateOnChange = false,
}: ValidatedInputProps) {
  const { values, errors, touched, setValue, setTouched, validateField } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);

  const error = touched[name] ? errors[name] : undefined;
  const isValid = touched[name] && !errors[name] && values[name];
  const inputType = type === 'password' && showPassword ? 'text' : type;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(name, e.target.value);
    if (validateOnChange) {
      setTimeout(() => validateField(name), 0);
    }
  };

  const handleBlur = () => {
    setTouched(name);
    if (validateOnBlur) {
      validateField(name);
    }
  };

  return (
    <div className={cn('space-y-1.5', className)} data-testid={`field-${name}`}>
      {label && (
        <Label htmlFor={name} className={cn(error && 'text-red-600')}>
          {label}
        </Label>
      )}
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={inputType}
          value={values[name] || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            error && 'border-red-500 focus-visible:ring-red-500',
            isValid && showValidIcon && 'border-green-500 focus-visible:ring-green-500',
            (showPasswordToggle || showValidIcon) && 'pr-10'
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
          data-testid={`input-${name}`}
        />
        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            data-testid={`toggle-password-${name}`}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {showValidIcon && isValid && type !== 'password' && (
          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
        )}
      </div>
      <FieldMessage
        name={name}
        error={error}
        helpText={helpText}
      />
    </div>
  );
}

interface ValidatedTextareaProps {
  name: string;
  label?: string;
  placeholder?: string;
  helpText?: string;
  className?: string;
  rows?: number;
  showCharCount?: boolean;
  maxLength?: number;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
}

/**
 * Validated Textarea - Textarea with inline validation
 */
export function ValidatedTextarea({
  name,
  label,
  placeholder,
  helpText,
  className,
  rows = 4,
  showCharCount = false,
  maxLength,
  validateOnBlur = true,
  validateOnChange = false,
}: ValidatedTextareaProps) {
  const { values, errors, touched, setValue, setTouched, validateField } = useFormContext();

  const error = touched[name] ? errors[name] : undefined;
  const charCount = (values[name] || '').length;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(name, e.target.value);
    if (validateOnChange) {
      setTimeout(() => validateField(name), 0);
    }
  };

  const handleBlur = () => {
    setTouched(name);
    if (validateOnBlur) {
      validateField(name);
    }
  };

  return (
    <div className={cn('space-y-1.5', className)} data-testid={`field-${name}`}>
      {label && (
        <Label htmlFor={name} className={cn(error && 'text-red-600')}>
          {label}
        </Label>
      )}
      <Textarea
        id={name}
        name={name}
        value={values[name] || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={cn(error && 'border-red-500 focus-visible:ring-red-500')}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
        data-testid={`textarea-${name}`}
      />
      <div className="flex justify-between">
        <FieldMessage name={name} error={error} helpText={helpText} />
        {showCharCount && (
          <span
            className={cn(
              'text-xs',
              maxLength && charCount >= maxLength ? 'text-red-500' : 'text-gray-500'
            )}
            data-testid={`char-count-${name}`}
          >
            {charCount}
            {maxLength && `/${maxLength}`}
          </span>
        )}
      </div>
    </div>
  );
}

interface FieldMessageProps {
  name: string;
  error?: string;
  helpText?: string;
}

/**
 * Field Message - Displays error or help text
 */
export function FieldMessage({ name, error, helpText }: FieldMessageProps) {
  if (error) {
    return (
      <p
        id={`${name}-error`}
        className="text-sm text-red-600 flex items-center gap-1"
        data-testid={`error-${name}`}
        role="alert"
      >
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        {error}
      </p>
    );
  }

  if (helpText) {
    return (
      <p
        id={`${name}-help`}
        className="text-sm text-gray-500 flex items-center gap-1"
        data-testid={`help-${name}`}
      >
        <Info className="w-3 h-3 flex-shrink-0" />
        {helpText}
      </p>
    );
  }

  return null;
}

interface SubmitButtonProps {
  children: ReactNode;
  className?: string;
  loadingText?: string;
}

/**
 * Submit Button - Form submit with loading state
 */
export function SubmitButton({ children, className, loadingText = 'Submitting...' }: SubmitButtonProps) {
  const { isSubmitting } = useFormContext();

  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      className={className}
      data-testid="submit-button"
    >
      {isSubmitting ? loadingText : children}
    </Button>
  );
}

interface FormErrorSummaryProps {
  className?: string;
}

/**
 * Form Error Summary - Summary of all form errors
 */
export function FormErrorSummary({ className }: FormErrorSummaryProps) {
  const { errors, touched } = useFormContext();

  const visibleErrors = Object.entries(errors).filter(
    ([field]) => touched[field]
  );

  if (visibleErrors.length === 0) return null;

  return (
    <div
      className={cn(
        'bg-red-50 border border-red-200 rounded-lg p-4 space-y-2',
        className
      )}
      data-testid="error-summary"
      role="alert"
    >
      <h4 className="text-sm font-medium text-red-800 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Please fix the following errors:
      </h4>
      <ul className="text-sm text-red-700 list-disc list-inside">
        {visibleErrors.map(([field, message]) => (
          <li key={field} data-testid={`summary-error-${field}`}>
            {message}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

/**
 * Password Strength Indicator - Visual password strength meter
 */
export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    if (score <= 2) return { level: 'weak', color: 'bg-red-500', text: 'Weak' };
    if (score <= 4) return { level: 'fair', color: 'bg-yellow-500', text: 'Fair' };
    if (score <= 5) return { level: 'good', color: 'bg-blue-500', text: 'Good' };
    return { level: 'strong', color: 'bg-green-500', text: 'Strong' };
  }, [password]);

  if (!password) return null;

  return (
    <div className={cn('space-y-1', className)} data-testid="password-strength">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              bar <= (strength.level === 'weak' ? 1 : strength.level === 'fair' ? 2 : strength.level === 'good' ? 3 : 4)
                ? strength.color
                : 'bg-gray-200'
            )}
            data-testid={`strength-bar-${bar}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-600" data-testid="strength-text">
        Password strength: <span className="font-medium">{strength.text}</span>
      </p>
    </div>
  );
}

interface InlineValidatedInputProps {
  value: string;
  onChange: (value: string) => void;
  rules: ValidationRule[];
  label?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';
  placeholder?: string;
  helpText?: string;
  className?: string;
  name?: string;
}

/**
 * Inline Validated Input - Standalone input with validation (no form context required)
 */
export function InlineValidatedInput({
  value,
  onChange,
  rules,
  label,
  type = 'text',
  placeholder,
  helpText,
  className,
  name = 'field',
}: InlineValidatedInputProps) {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setTouched(true);
    const validationError = validateField(value, rules);
    setError(validationError);
  };

  const displayError = touched ? error : null;

  return (
    <div className={cn('space-y-1.5', className)} data-testid={`inline-field-${name}`}>
      {label && (
        <Label htmlFor={name} className={cn(displayError && 'text-red-600')}>
          {label}
        </Label>
      )}
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(displayError && 'border-red-500 focus-visible:ring-red-500')}
        aria-invalid={!!displayError}
        data-testid={`inline-input-${name}`}
      />
      <FieldMessage name={name} error={displayError || undefined} helpText={helpText} />
    </div>
  );
}

/**
 * Hook for form validation without FormProvider
 */
export function useFormValidation<T extends Record<string, string>>(
  initialValues: T,
  fieldConfigs: FieldConfig[]
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback((name: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldTouched = useCallback((name: keyof T) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const validateFieldByName = useCallback(
    (name: keyof T): string | null => {
      const config = fieldConfigs.find((f) => f.name === name);
      if (!config?.rules) return null;

      const error = validateField(values[name] || '', config.rules, values as Record<string, string>);
      setErrors((prev) => {
        if (error) {
          return { ...prev, [name]: error };
        }
        const { [name]: _, ...rest } = prev; // eslint-disable-line @typescript-eslint/no-unused-vars
        return rest as Partial<Record<keyof T, string>>;
      });
      return error;
    },
    [fieldConfigs, values]
  );

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    const newTouched: Partial<Record<keyof T, boolean>> = {};

    for (const config of fieldConfigs) {
      newTouched[config.name as keyof T] = true;
      if (config.rules) {
        const error = validateField(
          values[config.name as keyof T] || '',
          config.rules,
          values as Record<string, string>
        );
        if (error) {
          newErrors[config.name as keyof T] = error;
        }
      }
    }

    setTouched(newTouched);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fieldConfigs, values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setTouched: setFieldTouched,
    validateField: validateFieldByName,
    validate,
    reset,
  };
}

export default {
  FormProvider,
  ValidatedInput,
  ValidatedTextarea,
  FieldMessage,
  SubmitButton,
  FormErrorSummary,
  PasswordStrength,
  InlineValidatedInput,
  validators,
  commonRules,
  validateField,
  useFormContext,
  useFormValidation,
};
