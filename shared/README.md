# @retail-agentic/shared

Shared utilities, types, and components for the Retail Agentic platform.

## Structure

```
shared/
├── types/          # Shared TypeScript interfaces and types
├── utils/          # Utility functions
├── config/         # Configuration constants
├── components/     # Shared React components (if needed)
└── index.ts        # Main entry point
```

## Usage

### In Frontend Projects

```typescript
import { Product, User, Order } from '@retail-agentic/shared/types';
import { formatCurrency, validateEmail } from '@retail-agentic/shared/utils';
```

### In Backend Projects

The TypeScript types can be used as reference for Java model definitions to ensure consistency across the stack.

## Development

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

### Lint

```bash
npm run lint
```

## Adding New Shared Code

1. Add your code to the appropriate directory (types, utils, config, components)
2. Export it from the main `index.ts` file
3. Update documentation
4. Run type checking and linting before committing
