import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import {
  useAutoFocus,
  useFocusTrap,
  useFocusReturn,
  useRouteAnnouncement,
  FocusTarget,
} from './FocusManagement';

describe('useAutoFocus', () => {
  it('should focus element on mount when shouldFocus is true', () => {
    function TestComponent() {
      const ref = useAutoFocus<HTMLButtonElement>(true);
      return <button ref={ref}>Focus me</button>;
    }

    render(<TestComponent />);

    const button = screen.getByRole('button', { name: /focus me/i });
    expect(document.activeElement).toBe(button);
  });

  it('should not focus element when shouldFocus is false', () => {
    function TestComponent() {
      const ref = useAutoFocus<HTMLButtonElement>(false);
      return <button ref={ref}>Do not focus</button>;
    }

    render(<TestComponent />);

    const button = screen.getByRole('button', { name: /do not focus/i });
    expect(document.activeElement).not.toBe(button);
  });

  it('should focus element by default', () => {
    function TestComponent() {
      const ref = useAutoFocus<HTMLInputElement>();
      return <input ref={ref} aria-label="Auto focus input" />;
    }

    render(<TestComponent />);

    const input = screen.getByLabelText(/auto focus input/i);
    expect(document.activeElement).toBe(input);
  });
});

describe('useFocusTrap', () => {
  it('should trap focus within container', () => {
    function TestComponent() {
      const ref = useFocusTrap<HTMLDivElement>(true);
      return (
        <div ref={ref}>
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
        </div>
      );
    }

    render(<TestComponent />);

    const buttons = screen.getAllByRole('button');
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('should focus first focusable element on mount', () => {
    function TestComponent() {
      const ref = useFocusTrap<HTMLDivElement>(true);
      return (
        <div ref={ref}>
          <input aria-label="Input 1" />
          <input aria-label="Input 2" />
        </div>
      );
    }

    render(<TestComponent />);

    const firstInput = screen.getByLabelText(/input 1/i);
    expect(document.activeElement).toBe(firstInput);
  });

  it('should not trap focus when isActive is false', () => {
    function TestComponent() {
      const ref = useFocusTrap<HTMLDivElement>(false);
      return (
        <div ref={ref}>
          <button>Button 1</button>
          <button>Button 2</button>
        </div>
      );
    }

    render(<TestComponent />);

    // When not active, first button should not be auto-focused
    expect(document.activeElement).toBe(document.body);
  });
});

describe('useFocusReturn', () => {
  it('should save and restore focus', () => {
    const { result } = renderHook(() => useFocusReturn());

    // Create a button and focus it
    const button = document.createElement('button');
    button.textContent = 'Original button';
    document.body.appendChild(button);
    button.focus();

    // Save focus
    result.current.saveFocus();

    // Focus something else
    const otherButton = document.createElement('button');
    otherButton.textContent = 'Other button';
    document.body.appendChild(otherButton);
    otherButton.focus();

    expect(document.activeElement).toBe(otherButton);

    // Restore focus
    result.current.restoreFocus();

    expect(document.activeElement).toBe(button);

    // Cleanup
    document.body.removeChild(button);
    document.body.removeChild(otherButton);
  });
});

describe('useRouteAnnouncement', () => {
  it('should set document title', () => {
    renderHook(() => useRouteAnnouncement('Products'));

    expect(document.title).toBe('Products - Retail Store');
  });

  it('should update title when page name changes', () => {
    const { rerender } = renderHook(
      ({ pageName }) => useRouteAnnouncement(pageName),
      { initialProps: { pageName: 'Home' } }
    );

    expect(document.title).toBe('Home - Retail Store');

    rerender({ pageName: 'Cart' });

    expect(document.title).toBe('Cart - Retail Store');
  });

  it('should focus main content if it exists', () => {
    // Create main content element
    const mainContent = document.createElement('div');
    mainContent.id = 'main-content';
    mainContent.tabIndex = -1;
    document.body.appendChild(mainContent);

    renderHook(() => useRouteAnnouncement('Products'));

    expect(document.activeElement).toBe(mainContent);

    // Cleanup
    document.body.removeChild(mainContent);
  });

  it('should not error if main content does not exist', () => {
    expect(() => {
      renderHook(() => useRouteAnnouncement('Products'));
    }).not.toThrow();
  });
});

describe('FocusTarget', () => {
  it('should render with id and tabIndex', () => {
    render(
      <FocusTarget id="main-content">
        <div>Content</div>
      </FocusTarget>
    );

    const target = document.getElementById('main-content');
    expect(target).toBeInTheDocument();
    expect(target).toHaveAttribute('tabindex', '-1');
  });

  it('should render children', () => {
    render(
      <FocusTarget id="test-target">
        <p>Test content</p>
      </FocusTarget>
    );

    expect(screen.getByText(/test content/i)).toBeInTheDocument();
  });

  it('should apply className if provided', () => {
    render(
      <FocusTarget id="styled-target" className="custom-class">
        <span>Styled content</span>
      </FocusTarget>
    );

    const target = document.getElementById('styled-target');
    expect(target).toHaveClass('custom-class');
  });

  it('should be focusable', () => {
    render(
      <FocusTarget id="focusable-target">
        <div>Focusable</div>
      </FocusTarget>
    );

    const target = document.getElementById('focusable-target');
    target?.focus();

    expect(document.activeElement).toBe(target);
  });
});
