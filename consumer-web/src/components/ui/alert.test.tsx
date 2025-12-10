import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from './alert';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

describe('Alert', () => {
  it('renders alert with content', () => {
    render(
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('has role="alert"', () => {
    render(<Alert>Content</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders default variant', () => {
    const { container } = render(<Alert>Content</Alert>);
    expect(container.firstChild).toHaveClass('bg-background');
  });

  it('renders destructive variant', () => {
    const { container } = render(<Alert variant="destructive">Content</Alert>);
    expect(container.firstChild).toHaveClass('border-destructive/50');
  });

  it('applies custom className', () => {
    const { container } = render(<Alert className="custom-class">Content</Alert>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with icon', () => {
    render(
      <Alert>
        <AlertCircle className="h-4 w-4" data-testid="alert-icon" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>This is a warning message</AlertDescription>
      </Alert>
    );

    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('renders success-style alert', () => {
    render(
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" data-testid="success-icon" />
        <AlertTitle className="text-green-800">Success!</AlertTitle>
        <AlertDescription className="text-green-700">Operation completed.</AlertDescription>
      </Alert>
    );

    expect(screen.getByTestId('success-icon')).toBeInTheDocument();
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('renders error-style alert', () => {
    render(
      <Alert className="bg-red-50 border-red-200">
        <XCircle className="h-4 w-4 text-red-600" data-testid="error-icon" />
        <AlertTitle className="text-red-800">Error</AlertTitle>
        <AlertDescription className="text-red-700">Something went wrong.</AlertDescription>
      </Alert>
    );

    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders info-style alert', () => {
    render(
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" data-testid="info-icon" />
        <AlertTitle className="text-blue-800">Info</AlertTitle>
        <AlertDescription className="text-blue-700">Here is some information.</AlertDescription>
      </Alert>
    );

    expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('AlertTitle renders as h5', () => {
    render(<AlertTitle>Test Title</AlertTitle>);
    const title = screen.getByText('Test Title');
    expect(title.tagName).toBe('H5');
  });

  it('AlertTitle applies custom className', () => {
    render(<AlertTitle className="custom-title">Test</AlertTitle>);
    expect(screen.getByText('Test')).toHaveClass('custom-title');
  });

  it('AlertDescription renders as div', () => {
    render(<AlertDescription>Test Description</AlertDescription>);
    const desc = screen.getByText('Test Description');
    expect(desc.tagName).toBe('DIV');
  });

  it('AlertDescription applies custom className', () => {
    render(<AlertDescription className="custom-desc">Test</AlertDescription>);
    expect(screen.getByText('Test')).toHaveClass('custom-desc');
  });

  it('renders full alert composition', () => {
    render(
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          You can add components and dependencies to your app using the cli.
        </AlertDescription>
      </Alert>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Heads up!')).toBeInTheDocument();
    expect(screen.getByText(/You can add components/)).toBeInTheDocument();
  });

  it('supports nested content in description', () => {
    render(
      <Alert>
        <AlertDescription>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </AlertDescription>
      </Alert>
    );

    expect(screen.getByText('First paragraph')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph')).toBeInTheDocument();
  });
});
