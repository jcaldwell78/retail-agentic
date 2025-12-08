import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';
import {
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
  type FieldConfig,
  type ValidationRule,
} from './FormValidation';

const mockFieldConfigs: FieldConfig[] = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    rules: [commonRules.required(), commonRules.email()],
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    rules: [commonRules.required(), commonRules.minLength(8)],
  },
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    rules: [commonRules.required()],
  },
];

const renderForm = (
  configs = mockFieldConfigs,
  onSubmit = vi.fn()
) => {
  return render(
    <FormProvider fieldConfigs={configs} onSubmit={onSubmit}>
      {configs.map((config) => (
        <ValidatedInput
          key={config.name}
          name={config.name}
          label={config.label}
          type={config.type === 'textarea' ? 'text' : config.type}
        />
      ))}
      <SubmitButton>Submit</SubmitButton>
    </FormProvider>
  );
};

describe('validators', () => {
  describe('required', () => {
    it('should return true for non-empty string', () => {
      expect(validators.required('test')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(validators.required('')).toBe(false);
    });

    it('should return false for whitespace only', () => {
      expect(validators.required('   ')).toBe(false);
    });
  });

  describe('email', () => {
    it('should return true for valid email', () => {
      expect(validators.email('test@example.com')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(validators.email('invalid')).toBe(false);
      expect(validators.email('test@')).toBe(false);
      expect(validators.email('@example.com')).toBe(false);
    });
  });

  describe('minLength', () => {
    it('should return true when length meets minimum', () => {
      expect(validators.minLength('12345678', 8)).toBe(true);
    });

    it('should return false when length is below minimum', () => {
      expect(validators.minLength('1234567', 8)).toBe(false);
    });
  });

  describe('maxLength', () => {
    it('should return true when length is within maximum', () => {
      expect(validators.maxLength('12345', 10)).toBe(true);
    });

    it('should return false when length exceeds maximum', () => {
      expect(validators.maxLength('12345678901', 10)).toBe(false);
    });
  });

  describe('pattern', () => {
    it('should return true when pattern matches', () => {
      expect(validators.pattern('ABC123', /^[A-Z]+\d+$/)).toBe(true);
    });

    it('should return false when pattern does not match', () => {
      expect(validators.pattern('abc123', /^[A-Z]+\d+$/)).toBe(false);
    });
  });

  describe('phone', () => {
    it('should return true for valid phone numbers', () => {
      expect(validators.phone('123-456-7890')).toBe(true);
      expect(validators.phone('+1 (123) 456-7890')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(validators.phone('123')).toBe(false);
    });
  });

  describe('password', () => {
    it('should return true for valid password', () => {
      expect(validators.password('Password1')).toBe(true);
    });

    it('should return false for weak password', () => {
      expect(validators.password('password')).toBe(false);
      expect(validators.password('PASSWORD1')).toBe(false);
      expect(validators.password('Pass1')).toBe(false);
    });
  });
});

describe('validateField', () => {
  it('should return null for valid field', () => {
    const rules = [commonRules.required(), commonRules.email()];
    expect(validateField('test@example.com', rules)).toBeNull();
  });

  it('should return error message for invalid field', () => {
    const rules = [commonRules.required()];
    expect(validateField('', rules)).toBe('This field is required');
  });

  it('should check rules in order', () => {
    const rules = [commonRules.required(), commonRules.email()];
    expect(validateField('', rules)).toBe('This field is required');
    expect(validateField('invalid', rules)).toBe('Please enter a valid email address');
  });

  it('should handle match rule', () => {
    const rules: ValidationRule[] = [
      { type: 'match', value: 'password', message: 'Passwords must match' },
    ];
    const formValues = { password: 'secret123' };
    expect(validateField('secret123', rules, formValues)).toBeNull();
    expect(validateField('different', rules, formValues)).toBe('Passwords must match');
  });

  it('should handle custom validation', () => {
    const rules: ValidationRule[] = [
      {
        type: 'custom',
        message: 'Must be even',
        validate: (value) => parseInt(value) % 2 === 0,
      },
    ];
    expect(validateField('4', rules)).toBeNull();
    expect(validateField('3', rules)).toBe('Must be even');
  });
});

describe('FormProvider', () => {
  it('should render form', () => {
    renderForm();
    expect(screen.getByTestId('validated-form')).toBeInTheDocument();
  });

  it('should render all fields', () => {
    renderForm();
    expect(screen.getByTestId('field-email')).toBeInTheDocument();
    expect(screen.getByTestId('field-password')).toBeInTheDocument();
    expect(screen.getByTestId('field-name')).toBeInTheDocument();
  });

  it('should call onSubmit with values when form is valid', async () => {
    const onSubmit = vi.fn();
    renderForm(mockFieldConfigs, onSubmit);

    await userEvent.type(screen.getByTestId('input-email'), 'test@example.com');
    await userEvent.type(screen.getByTestId('input-password'), 'password123');
    await userEvent.type(screen.getByTestId('input-name'), 'John Doe');
    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
      });
    });
  });

  it('should not call onSubmit when form is invalid', async () => {
    const onSubmit = vi.fn();
    renderForm(mockFieldConfigs, onSubmit);

    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it('should show errors after submit attempt', async () => {
    renderForm();

    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-email')).toBeInTheDocument();
      expect(screen.getByTestId('error-password')).toBeInTheDocument();
      expect(screen.getByTestId('error-name')).toBeInTheDocument();
    });
  });
});

describe('ValidatedInput', () => {
  it('should render input with label', () => {
    renderForm();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('should show error on blur when invalid', async () => {
    renderForm();

    const input = screen.getByTestId('input-email');
    await userEvent.click(input);
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByTestId('error-email')).toBeInTheDocument();
    });
  });

  it('should clear error when field becomes valid', async () => {
    renderForm();

    const input = screen.getByTestId('input-email');
    await userEvent.click(input);
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByTestId('error-email')).toBeInTheDocument();
    });

    await userEvent.type(input, 'test@example.com');
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.queryByTestId('error-email')).not.toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    render(
      <FormProvider fieldConfigs={mockFieldConfigs}>
        <ValidatedInput name="password" label="Password" type="password" showPasswordToggle />
      </FormProvider>
    );

    const input = screen.getByTestId('input-password');
    expect(input).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByTestId('toggle-password-password'));
    expect(input).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByTestId('toggle-password-password'));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should apply error styles when invalid', async () => {
    renderForm();

    const input = screen.getByTestId('input-email');
    await userEvent.click(input);
    await userEvent.tab();

    await waitFor(() => {
      expect(input).toHaveClass('border-red-500');
    });
  });
});

describe('ValidatedTextarea', () => {
  const textareaConfig: FieldConfig[] = [
    {
      name: 'message',
      label: 'Message',
      type: 'textarea',
      rules: [commonRules.required(), commonRules.maxLength(100)],
    },
  ];

  it('should render textarea', () => {
    render(
      <FormProvider fieldConfigs={textareaConfig}>
        <ValidatedTextarea name="message" label="Message" />
      </FormProvider>
    );
    expect(screen.getByTestId('textarea-message')).toBeInTheDocument();
  });

  it('should show character count', () => {
    render(
      <FormProvider fieldConfigs={textareaConfig}>
        <ValidatedTextarea name="message" label="Message" showCharCount maxLength={100} />
      </FormProvider>
    );
    expect(screen.getByTestId('char-count-message')).toHaveTextContent('0/100');
  });

  it('should update character count on input', async () => {
    render(
      <FormProvider fieldConfigs={textareaConfig}>
        <ValidatedTextarea name="message" label="Message" showCharCount maxLength={100} />
      </FormProvider>
    );

    await userEvent.type(screen.getByTestId('textarea-message'), 'Hello');
    expect(screen.getByTestId('char-count-message')).toHaveTextContent('5/100');
  });

  it('should show error when exceeds maxLength', async () => {
    render(
      <FormProvider fieldConfigs={textareaConfig}>
        <ValidatedTextarea name="message" label="Message" />
        <SubmitButton>Submit</SubmitButton>
      </FormProvider>
    );

    const textarea = screen.getByTestId('textarea-message');
    const longText = 'a'.repeat(101);
    await userEvent.type(textarea, longText);
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });
});

describe('FieldMessage', () => {
  it('should render error message', () => {
    render(<FieldMessage name="test" error="This is an error" />);
    expect(screen.getByTestId('error-test')).toHaveTextContent('This is an error');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render help text when no error', () => {
    render(<FieldMessage name="test" helpText="This is help text" />);
    expect(screen.getByTestId('help-test')).toHaveTextContent('This is help text');
  });

  it('should prioritize error over help text', () => {
    render(<FieldMessage name="test" error="Error" helpText="Help" />);
    expect(screen.getByTestId('error-test')).toBeInTheDocument();
    expect(screen.queryByTestId('help-test')).not.toBeInTheDocument();
  });

  it('should render nothing when no error or help', () => {
    const { container } = render(<FieldMessage name="test" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('SubmitButton', () => {
  it('should render button', () => {
    render(
      <FormProvider fieldConfigs={[]}>
        <SubmitButton>Submit</SubmitButton>
      </FormProvider>
    );
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Submit');
  });

  it('should show loading text when submitting', async () => {
    const onSubmit = vi.fn((): Promise<void> => new Promise((resolve) => setTimeout(resolve, 100)));
    render(
      <FormProvider fieldConfigs={[]} onSubmit={onSubmit}>
        <SubmitButton loadingText="Loading...">Submit</SubmitButton>
      </FormProvider>
    );

    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toHaveTextContent('Loading...');
    });
  });
});

describe('FormErrorSummary', () => {
  it('should render error summary when there are errors', async () => {
    render(
      <FormProvider fieldConfigs={mockFieldConfigs}>
        <ValidatedInput name="email" label="Email" />
        <FormErrorSummary />
        <SubmitButton>Submit</SubmitButton>
      </FormProvider>
    );

    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-summary')).toBeInTheDocument();
      expect(screen.getByTestId('summary-error-email')).toBeInTheDocument();
    });
  });

  it('should not render when no errors', () => {
    render(
      <FormProvider fieldConfigs={[]}>
        <FormErrorSummary />
      </FormProvider>
    );
    expect(screen.queryByTestId('error-summary')).not.toBeInTheDocument();
  });
});

describe('PasswordStrength', () => {
  it('should not render for empty password', () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should show weak for simple password', () => {
    render(<PasswordStrength password="abc" />);
    expect(screen.getByTestId('strength-text')).toHaveTextContent('Weak');
  });

  it('should show fair for moderate password', () => {
    render(<PasswordStrength password="Password1" />);
    expect(screen.getByTestId('strength-text')).toHaveTextContent('Fair');
  });

  it('should show good for strong password', () => {
    // Score 5: >=8 chars (1), lowercase (1), uppercase (1), digit (1), special (1) = 5 → Good
    render(<PasswordStrength password="Passw0rd!" />);
    expect(screen.getByTestId('strength-text')).toHaveTextContent('Good');
  });

  it('should show strong for very strong password', () => {
    // Score 6: >=12 chars (2), lowercase (1), uppercase (1), digit (1), special (1) = 6 → Strong
    render(<PasswordStrength password="Password123!" />);
    expect(screen.getByTestId('strength-text')).toHaveTextContent('Strong');
  });

  it('should render strength bars', () => {
    render(<PasswordStrength password="Password1" />);
    expect(screen.getByTestId('strength-bar-1')).toBeInTheDocument();
    expect(screen.getByTestId('strength-bar-2')).toBeInTheDocument();
    expect(screen.getByTestId('strength-bar-3')).toBeInTheDocument();
    expect(screen.getByTestId('strength-bar-4')).toBeInTheDocument();
  });
});

describe('InlineValidatedInput', () => {
  it('should render standalone input', () => {
    render(
      <InlineValidatedInput
        value=""
        onChange={() => {}}
        rules={[commonRules.required()]}
        name="standalone"
        label="Standalone Field"
      />
    );
    expect(screen.getByTestId('inline-field-standalone')).toBeInTheDocument();
  });

  it('should validate on blur', async () => {
    const onChange = vi.fn();
    render(
      <InlineValidatedInput
        value=""
        onChange={onChange}
        rules={[commonRules.required()]}
        name="standalone"
      />
    );

    await userEvent.click(screen.getByTestId('inline-input-standalone'));
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByTestId('error-standalone')).toBeInTheDocument();
    });
  });

  it('should clear error when valid', async () => {
    let value = '';
    const onChange = (v: string) => { value = v; };

    const { rerender } = render(
      <InlineValidatedInput
        value={value}
        onChange={onChange}
        rules={[commonRules.required()]}
        name="standalone"
      />
    );

    await userEvent.click(screen.getByTestId('inline-input-standalone'));
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByTestId('error-standalone')).toBeInTheDocument();
    });

    rerender(
      <InlineValidatedInput
        value="valid value"
        onChange={onChange}
        rules={[commonRules.required()]}
        name="standalone"
      />
    );

    await userEvent.click(screen.getByTestId('inline-input-standalone'));
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.queryByTestId('error-standalone')).not.toBeInTheDocument();
    });
  });
});

describe('useFormValidation hook', () => {
  const configs: FieldConfig[] = [
    { name: 'email', label: 'Email', rules: [commonRules.required(), commonRules.email()] },
    { name: 'name', label: 'Name', rules: [commonRules.required()] },
  ];

  it('should initialize with empty values', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: '', name: '' }, configs)
    );

    expect(result.current.values.email).toBe('');
    expect(result.current.values.name).toBe('');
    expect(result.current.isValid).toBe(true);
  });

  it('should update values', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: '', name: '' }, configs)
    );

    act(() => {
      result.current.setValue('email', 'test@example.com');
    });

    expect(result.current.values.email).toBe('test@example.com');
  });

  it('should validate field', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: '', name: '' }, configs)
    );

    act(() => {
      result.current.validateField('email');
    });

    expect(result.current.errors.email).toBe('This field is required');
  });

  it('should validate entire form', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: '', name: '' }, configs)
    );

    let isValid: boolean;
    act(() => {
      isValid = result.current.validate();
    });

    expect(isValid!).toBe(false);
    expect(result.current.errors.email).toBeDefined();
    expect(result.current.errors.name).toBeDefined();
  });

  it('should reset form', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: '', name: '' }, configs)
    );

    act(() => {
      result.current.setValue('email', 'test@example.com');
      result.current.validate();
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.values.email).toBe('');
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });
});

describe('useFormContext', () => {
  it('should throw error when used outside FormProvider', () => {
    const TestComponent = () => {
      useFormContext();
      return null;
    };

    expect(() => render(<TestComponent />)).toThrow(
      'useFormContext must be used within a FormProvider'
    );
  });
});

describe('commonRules', () => {
  it('should create required rule', () => {
    const rule = commonRules.required();
    expect(rule.type).toBe('required');
    expect(rule.message).toBe('This field is required');
  });

  it('should create required rule with custom message', () => {
    const rule = commonRules.required('Custom message');
    expect(rule.message).toBe('Custom message');
  });

  it('should create email rule', () => {
    const rule = commonRules.email();
    expect(rule.type).toBe('email');
  });

  it('should create minLength rule', () => {
    const rule = commonRules.minLength(5);
    expect(rule.type).toBe('minLength');
    expect(rule.value).toBe(5);
    expect(rule.message).toBe('Must be at least 5 characters');
  });

  it('should create maxLength rule', () => {
    const rule = commonRules.maxLength(10);
    expect(rule.type).toBe('maxLength');
    expect(rule.value).toBe(10);
    expect(rule.message).toBe('Must be no more than 10 characters');
  });

  it('should create pattern rule', () => {
    const pattern = /^[A-Z]+$/;
    const rule = commonRules.pattern(pattern, 'Must be uppercase');
    expect(rule.type).toBe('pattern');
    expect(rule.value).toBe(pattern);
    expect(rule.message).toBe('Must be uppercase');
  });

  it('should create match rule', () => {
    const rule = commonRules.match('password');
    expect(rule.type).toBe('match');
    expect(rule.value).toBe('password');
  });

  it('should create password rule', () => {
    const rule = commonRules.password();
    expect(rule.type).toBe('pattern');
  });

  it('should create phone rule', () => {
    const rule = commonRules.phone();
    expect(rule.type).toBe('pattern');
  });
});

describe('Accessibility', () => {
  it('should have accessible error messages', async () => {
    renderForm();

    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      const error = screen.getByTestId('error-email');
      expect(error).toHaveAttribute('role', 'alert');
    });
  });

  it('should have aria-invalid on invalid inputs', async () => {
    renderForm();

    const input = screen.getByTestId('input-email');
    await userEvent.click(input);
    await userEvent.tab();

    await waitFor(() => {
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('should have proper form labels', () => {
    renderForm();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });
});
