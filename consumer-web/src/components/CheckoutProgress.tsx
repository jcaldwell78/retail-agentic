import {
  ShoppingCart,
  User,
  Truck,
  CreditCard,
  CheckCircle,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CheckoutStep = 'cart' | 'information' | 'shipping' | 'payment' | 'confirmation';

interface StepConfig {
  id: CheckoutStep;
  label: string;
  icon: React.ElementType;
}

const CHECKOUT_STEPS: StepConfig[] = [
  { id: 'cart', label: 'Cart', icon: ShoppingCart },
  { id: 'information', label: 'Information', icon: User },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'confirmation', label: 'Confirmation', icon: CheckCircle },
];

interface CheckoutProgressProps {
  currentStep: CheckoutStep;
  completedSteps?: CheckoutStep[];
  variant?: 'default' | 'compact' | 'vertical';
  className?: string;
  onStepClick?: (step: CheckoutStep) => void;
}

/**
 * Get the index of a step
 */
function getStepIndex(step: CheckoutStep): number {
  return CHECKOUT_STEPS.findIndex((s) => s.id === step);
}

/**
 * Check if a step is completed
 */
function isStepCompleted(
  step: CheckoutStep,
  currentStep: CheckoutStep,
  completedSteps?: CheckoutStep[]
): boolean {
  if (completedSteps?.includes(step)) return true;
  return getStepIndex(step) < getStepIndex(currentStep);
}

/**
 * Check if a step is active
 */
function isStepActive(step: CheckoutStep, currentStep: CheckoutStep): boolean {
  return step === currentStep;
}

/**
 * Check if a step is accessible (can be clicked)
 */
function isStepAccessible(
  step: CheckoutStep,
  currentStep: CheckoutStep,
  completedSteps?: CheckoutStep[]
): boolean {
  if (isStepCompleted(step, currentStep, completedSteps)) return true;
  if (isStepActive(step, currentStep)) return true;
  return false;
}

interface StepIndicatorProps {
  step: StepConfig;
  isActive: boolean;
  isCompleted: boolean;
  isAccessible: boolean;
  onClick?: () => void;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Individual step indicator
 */
function StepIndicator({
  step,
  isActive,
  isCompleted,
  isAccessible,
  onClick,
  showLabel = true,
  size = 'md',
}: StepIndicatorProps) {
  const Icon = step.icon;

  const sizeClasses = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-xs' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-sm' },
    lg: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-base' },
  };

  const sizes = sizeClasses[size];

  const getStepStyles = () => {
    if (isCompleted) {
      return {
        container: 'bg-green-600 text-white border-green-600',
        text: 'text-green-600 font-medium',
      };
    }
    if (isActive) {
      return {
        container: 'bg-blue-600 text-white border-blue-600',
        text: 'text-blue-600 font-medium',
      };
    }
    return {
      container: 'bg-gray-100 text-gray-400 border-gray-300',
      text: 'text-gray-400',
    };
  };

  const styles = getStepStyles();

  const Wrapper = isAccessible && onClick ? 'button' : 'div';

  return (
    <div className="flex flex-col items-center">
      <Wrapper
        className={cn(
          'rounded-full border-2 flex items-center justify-center transition-all',
          sizes.container,
          styles.container,
          isAccessible && onClick && 'cursor-pointer hover:scale-105',
          !isAccessible && 'cursor-not-allowed'
        )}
        onClick={isAccessible && onClick ? onClick : undefined}
        aria-label={step.label}
        aria-current={isActive ? 'step' : undefined}
        data-testid={`step-indicator-${step.id}`}
        data-completed={isCompleted}
        data-active={isActive}
      >
        {isCompleted ? (
          <CheckCircle className={sizes.icon} />
        ) : (
          <Icon className={sizes.icon} />
        )}
      </Wrapper>
      {showLabel && (
        <span className={cn('mt-2', sizes.text, styles.text)}>{step.label}</span>
      )}
    </div>
  );
}

/**
 * Horizontal checkout progress indicator
 */
export function CheckoutProgress({
  currentStep,
  completedSteps,
  variant = 'default',
  className,
  onStepClick,
}: CheckoutProgressProps) {
  if (variant === 'vertical') {
    return (
      <CheckoutProgressVertical
        currentStep={currentStep}
        completedSteps={completedSteps}
        className={className}
        onStepClick={onStepClick}
      />
    );
  }

  const isCompact = variant === 'compact';

  return (
    <div
      className={cn('w-full', className)}
      data-testid="checkout-progress"
      aria-label="Checkout progress"
      role="navigation"
    >
      <div className="flex items-center justify-between">
        {CHECKOUT_STEPS.map((step, index) => {
          const completed = isStepCompleted(step.id, currentStep, completedSteps);
          const active = isStepActive(step.id, currentStep);
          const accessible = isStepAccessible(step.id, currentStep, completedSteps);

          return (
            <div
              key={step.id}
              className="flex items-center flex-1 last:flex-none"
            >
              <StepIndicator
                step={step}
                isActive={active}
                isCompleted={completed}
                isAccessible={accessible}
                onClick={onStepClick ? () => onStepClick(step.id) : undefined}
                showLabel={!isCompact}
                size={isCompact ? 'sm' : 'md'}
              />

              {/* Connector line */}
              {index < CHECKOUT_STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2',
                    isCompact && 'mx-1',
                    completed ? 'bg-green-600' : 'bg-gray-200'
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Vertical checkout progress indicator
 */
function CheckoutProgressVertical({
  currentStep,
  completedSteps,
  className,
  onStepClick,
}: Omit<CheckoutProgressProps, 'variant'>) {
  return (
    <div
      className={cn('w-full', className)}
      data-testid="checkout-progress-vertical"
      aria-label="Checkout progress"
      role="navigation"
    >
      <div className="flex flex-col">
        {CHECKOUT_STEPS.map((step, index) => {
          const completed = isStepCompleted(step.id, currentStep, completedSteps);
          const active = isStepActive(step.id, currentStep);
          const accessible = isStepAccessible(step.id, currentStep, completedSteps);
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-start">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <button
                  className={cn(
                    'w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all',
                    completed && 'bg-green-600 text-white border-green-600',
                    active && !completed && 'bg-blue-600 text-white border-blue-600',
                    !active && !completed && 'bg-gray-100 text-gray-400 border-gray-300',
                    accessible && onStepClick && 'cursor-pointer hover:scale-105',
                    !accessible && 'cursor-not-allowed'
                  )}
                  onClick={accessible && onStepClick ? () => onStepClick(step.id) : undefined}
                  disabled={!accessible}
                  aria-label={step.label}
                  aria-current={active ? 'step' : undefined}
                  data-testid={`step-indicator-${step.id}`}
                >
                  {completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </button>

                {/* Connector line */}
                {index < CHECKOUT_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 h-12',
                      completed ? 'bg-green-600' : 'bg-gray-200'
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Step content */}
              <div className="ml-4 pb-8">
                <p
                  className={cn(
                    'font-medium',
                    completed && 'text-green-600',
                    active && !completed && 'text-blue-600',
                    !active && !completed && 'text-gray-400'
                  )}
                >
                  {step.label}
                </p>
                {active && (
                  <p className="text-sm text-gray-500 mt-1">
                    {getStepDescription(step.id)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Get description for a step
 */
function getStepDescription(step: CheckoutStep): string {
  const descriptions: Record<CheckoutStep, string> = {
    cart: 'Review your items',
    information: 'Enter your contact details',
    shipping: 'Choose shipping method',
    payment: 'Enter payment information',
    confirmation: 'Order completed!',
  };
  return descriptions[step];
}

/**
 * Simple text-based progress indicator
 */
export function CheckoutProgressText({
  currentStep,
  className,
}: {
  currentStep: CheckoutStep;
  className?: string;
}) {
  const currentIndex = getStepIndex(currentStep) + 1;
  const totalSteps = CHECKOUT_STEPS.length;
  const currentConfig = CHECKOUT_STEPS.find((s) => s.id === currentStep);

  return (
    <div
      className={cn('flex items-center justify-between', className)}
      data-testid="checkout-progress-text"
    >
      <span className="text-sm text-gray-600">
        Step {currentIndex} of {totalSteps}
      </span>
      <span className="text-sm font-medium text-gray-900">
        {currentConfig?.label}
      </span>
    </div>
  );
}

/**
 * Breadcrumb style checkout progress
 */
export function CheckoutBreadcrumb({
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: Omit<CheckoutProgressProps, 'variant'>) {
  return (
    <nav
      className={cn('flex items-center flex-wrap gap-2', className)}
      data-testid="checkout-breadcrumb"
      aria-label="Checkout progress"
    >
      {CHECKOUT_STEPS.map((step, index) => {
        const completed = isStepCompleted(step.id, currentStep, completedSteps);
        const active = isStepActive(step.id, currentStep);
        const accessible = isStepAccessible(step.id, currentStep, completedSteps);

        return (
          <div key={step.id} className="flex items-center">
            {accessible && onStepClick ? (
              <button
                onClick={() => onStepClick(step.id)}
                className={cn(
                  'text-sm transition-colors',
                  completed && 'text-green-600 hover:text-green-700',
                  active && 'text-blue-600 font-medium',
                  !active && !completed && 'text-gray-400'
                )}
                aria-current={active ? 'step' : undefined}
              >
                {step.label}
              </button>
            ) : (
              <span
                className={cn(
                  'text-sm',
                  completed && 'text-green-600',
                  active && 'text-blue-600 font-medium',
                  !active && !completed && 'text-gray-400'
                )}
                aria-current={active ? 'step' : undefined}
              >
                {step.label}
              </span>
            )}

            {index < CHECKOUT_STEPS.length - 1 && (
              <span className="mx-2 text-gray-300" aria-hidden="true">
                /
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/**
 * Progress bar style indicator
 */
export function CheckoutProgressBar({
  currentStep,
  className,
}: {
  currentStep: CheckoutStep;
  className?: string;
}) {
  const currentIndex = getStepIndex(currentStep);
  const totalSteps = CHECKOUT_STEPS.length - 1; // -1 because we count transitions
  const progress = (currentIndex / totalSteps) * 100;

  return (
    <div className={cn('w-full', className)} data-testid="checkout-progress-bar">
      <div className="flex justify-between mb-2">
        {CHECKOUT_STEPS.map((step) => (
          <span
            key={step.id}
            className={cn(
              'text-xs',
              isStepActive(step.id, currentStep)
                ? 'text-blue-600 font-medium'
                : getStepIndex(step.id) < getStepIndex(currentStep)
                  ? 'text-green-600'
                  : 'text-gray-400'
            )}
          >
            {step.label}
          </span>
        ))}
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Checkout progress: ${Math.round(progress)}%`}
        />
      </div>
    </div>
  );
}

export default CheckoutProgress;
