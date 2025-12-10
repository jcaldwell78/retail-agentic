import { CreditCard, Smartphone, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export type PaymentMethod = 'paypal' | 'apple_pay' | 'google_pay' | 'credit_card';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onMethodSelect: (method: PaymentMethod) => void;
  availableMethods?: PaymentMethod[];
}

const paymentMethods = [
  {
    id: 'paypal' as PaymentMethod,
    name: 'PayPal',
    description: 'Fast and secure payment',
    icon: Package,
    bgColor: 'bg-[#FFC439]',
    iconColor: 'text-[#003087]',
  },
  {
    id: 'apple_pay' as PaymentMethod,
    name: 'Apple Pay',
    description: 'Pay with Touch ID or Face ID',
    icon: Smartphone,
    bgColor: 'bg-black',
    iconColor: 'text-white',
  },
  {
    id: 'google_pay' as PaymentMethod,
    name: 'Google Pay',
    description: 'Fast checkout with Google',
    icon: Smartphone,
    bgColor: 'bg-white',
    iconColor: 'text-[#4285F4]',
  },
  {
    id: 'credit_card' as PaymentMethod,
    name: 'Credit Card',
    description: 'Pay with Visa, Mastercard, or Amex',
    icon: CreditCard,
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-700',
  },
];

export function PaymentMethodSelector({
  selectedMethod,
  onMethodSelect,
  availableMethods = ['paypal', 'apple_pay', 'google_pay', 'credit_card'],
}: PaymentMethodSelectorProps) {
  const filteredMethods = paymentMethods.filter(method =>
    availableMethods.includes(method.id)
  );

  return (
    <RadioGroup
      value={selectedMethod || ''}
      onValueChange={(value: string) => onMethodSelect(value as PaymentMethod)}
      className="space-y-3"
    >
      {filteredMethods.map((method) => (
        <Card
          key={method.id}
          className={`cursor-pointer transition-all ${
            selectedMethod === method.id
              ? 'ring-2 ring-primary border-primary'
              : 'hover:shadow-md'
          }`}
          onClick={() => onMethodSelect(method.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <RadioGroupItem value={method.id} id={method.id} />
              <div className={`p-2 rounded-lg ${method.bgColor}`}>
                <method.icon className={`h-6 w-6 ${method.iconColor}`} />
              </div>
              <div className="flex-1">
                <Label htmlFor={method.id} className="cursor-pointer">
                  <div className="font-medium">{method.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {method.description}
                  </div>
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </RadioGroup>
  );
}