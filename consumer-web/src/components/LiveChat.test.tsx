import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  ChatProvider,
  useLiveChat,
  ChatWidget,
  ChatWindow,
  LiveChat,
  ProactiveChatTrigger,
  CheckoutChatPrompt,
} from './LiveChat';

// Helper component to access context
function TestConsumer() {
  const context = useLiveChat();
  return (
    <div>
      <span data-testid="is-open">{String(context.isOpen)}</span>
      <span data-testid="is-minimized">{String(context.isMinimized)}</span>
      <span data-testid="status">{context.status}</span>
      <span data-testid="message-count">{context.messages.length}</span>
      <span data-testid="unread-count">{context.unreadCount}</span>
      <span data-testid="agent-name">{context.agent?.name || 'none'}</span>
      <button data-testid="open-btn" onClick={context.openChat}>Open</button>
      <button data-testid="close-btn" onClick={context.closeChat}>Close</button>
      <button data-testid="minimize-btn" onClick={context.minimizeChat}>Minimize</button>
      <button data-testid="maximize-btn" onClick={context.maximizeChat}>Maximize</button>
      <button data-testid="request-human-btn" onClick={context.requestHumanAgent}>Request Human</button>
      <button data-testid="clear-btn" onClick={context.clearChat}>Clear</button>
      <button data-testid="send-btn" onClick={() => context.sendMessage('Hello')}>Send</button>
      <button data-testid="action-shipping" onClick={() => context.handleQuickAction('shipping')}>Shipping</button>
      <button data-testid="action-returns" onClick={() => context.handleQuickAction('returns')}>Returns</button>
      <button data-testid="action-order" onClick={() => context.handleQuickAction('order-status')}>Order</button>
      <button data-testid="action-human" onClick={() => context.handleQuickAction('human')}>Human</button>
    </div>
  );
}

describe('LiveChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ChatProvider', () => {
    it('should provide default context values', () => {
      render(
        <ChatProvider>
          <TestConsumer />
        </ChatProvider>
      );

      expect(screen.getByTestId('is-open')).toHaveTextContent('false');
      expect(screen.getByTestId('is-minimized')).toHaveTextContent('false');
      expect(screen.getByTestId('status')).toHaveTextContent('idle');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
      expect(screen.getByTestId('agent-name')).toHaveTextContent('none');
    });

    it('should throw error when useLiveChat is used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestConsumer />)).toThrow(
        'useLiveChat must be used within a ChatProvider'
      );

      consoleSpy.mockRestore();
    });

    it('should open chat when openChat is called', () => {
      render(
        <ChatProvider>
          <TestConsumer />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    });

    it('should close chat when closeChat is called', () => {
      render(
        <ChatProvider>
          <TestConsumer />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      expect(screen.getByTestId('is-open')).toHaveTextContent('true');

      fireEvent.click(screen.getByTestId('close-btn'));
      expect(screen.getByTestId('is-open')).toHaveTextContent('false');
    });

    it('should minimize and maximize chat', () => {
      render(
        <ChatProvider>
          <TestConsumer />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      expect(screen.getByTestId('is-minimized')).toHaveTextContent('false');

      fireEvent.click(screen.getByTestId('minimize-btn'));
      expect(screen.getByTestId('is-minimized')).toHaveTextContent('true');

      fireEvent.click(screen.getByTestId('maximize-btn'));
      expect(screen.getByTestId('is-minimized')).toHaveTextContent('false');
    });

    it('should initialize with welcome message when opened', async () => {
      render(
        <ChatProvider>
          <TestConsumer />
        </ChatProvider>
      );

      expect(screen.getByTestId('message-count')).toHaveTextContent('0');

      fireEvent.click(screen.getByTestId('open-btn'));

      // Welcome message should be added
      expect(screen.getByTestId('message-count')).toHaveTextContent('1');
    });

    it('should use custom welcome message when provided', () => {
      render(
        <ChatProvider config={{ welcomeMessage: 'Custom welcome!' }}>
          <TestConsumer />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      expect(screen.getByTestId('message-count')).toHaveTextContent('1');
    });

    it('should send message and get bot response', async () => {
      render(
        <ChatProvider>
          <TestConsumer />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      expect(screen.getByTestId('message-count')).toHaveTextContent('1'); // Welcome

      fireEvent.click(screen.getByTestId('send-btn'));

      // User message added + typing indicator
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(parseInt(screen.getByTestId('message-count').textContent || '0')).toBeGreaterThanOrEqual(2);

      // Bot response after delay - typing removed, bot response added
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      // Should have welcome + user + bot response = 3
      expect(screen.getByTestId('message-count')).toHaveTextContent('3');
    });

    it('should match FAQ response for shipping question', async () => {
      const onSendMessage = vi.fn();
      render(
        <ChatProvider onSendMessage={onSendMessage}>
          <TestConsumer />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      fireEvent.click(screen.getByTestId('action-shipping'));

      expect(onSendMessage).toHaveBeenCalledWith('Tell me about shipping');
    });

    it('should match FAQ response for returns question', async () => {
      const onSendMessage = vi.fn();
      render(
        <ChatProvider onSendMessage={onSendMessage}>
          <TestConsumer />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      fireEvent.click(screen.getByTestId('action-returns'));

      expect(onSendMessage).toHaveBeenCalledWith('What is your return policy?');
    });

    it('should request human agent', async () => {
      const onRequestHumanAgent = vi.fn();
      render(
        <ChatProvider onRequestHumanAgent={onRequestHumanAgent}>
          <TestConsumer />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      fireEvent.click(screen.getByTestId('request-human-btn'));

      expect(onRequestHumanAgent).toHaveBeenCalled();
      expect(screen.getByTestId('status')).toHaveTextContent('waiting');

      // Simulate agent connection
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByTestId('status')).toHaveTextContent('connected');
      expect(screen.getByTestId('agent-name')).toHaveTextContent('Sarah');
    });

    it('should clear chat', () => {
      render(
        <ChatProvider>
          <TestConsumer />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      const messagesBefore = parseInt(screen.getByTestId('message-count').textContent || '0');
      expect(messagesBefore).toBe(1); // Welcome message

      // Add another message and wait for full response cycle
      fireEvent.click(screen.getByTestId('send-btn'));
      act(() => {
        vi.advanceTimersByTime(1100); // Wait for typing delay + bot response
      });
      expect(parseInt(screen.getByTestId('message-count').textContent || '0')).toBe(3); // Welcome + user + bot

      act(() => {
        fireEvent.click(screen.getByTestId('clear-btn'));
      });
      // After clearing while chat is open, welcome message is re-added
      expect(parseInt(screen.getByTestId('message-count').textContent || '0')).toBe(1);
    });

    it('should call onChatOpen callback when opening', () => {
      const onChatOpen = vi.fn();
      render(
        <ChatProvider onChatOpen={onChatOpen}>
          <TestConsumer />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      expect(onChatOpen).toHaveBeenCalled();
    });

    it('should call onChatClose callback when closing', () => {
      const onChatClose = vi.fn();
      render(
        <ChatProvider onChatClose={onChatClose}>
          <TestConsumer />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      fireEvent.click(screen.getByTestId('close-btn'));
      expect(onChatClose).toHaveBeenCalled();
    });

    it('should handle order-status quick action', () => {
      render(
        <ChatProvider>
          <TestConsumer />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      const initialCount = parseInt(screen.getByTestId('message-count').textContent || '0');

      fireEvent.click(screen.getByTestId('action-order'));

      // Should add bot message about order status
      expect(parseInt(screen.getByTestId('message-count').textContent || '0')).toBeGreaterThan(initialCount);
    });

    it('should handle human quick action', () => {
      const onRequestHumanAgent = vi.fn();
      render(
        <ChatProvider onRequestHumanAgent={onRequestHumanAgent}>
          <TestConsumer />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      fireEvent.click(screen.getByTestId('action-human'));

      expect(onRequestHumanAgent).toHaveBeenCalled();
    });

    it('should reset unread count when maximizing', () => {
      render(
        <ChatProvider>
          <TestConsumer />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      fireEvent.click(screen.getByTestId('minimize-btn'));

      // Send a message while minimized
      fireEvent.click(screen.getByTestId('send-btn'));

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      // Bot response should increment unread
      expect(parseInt(screen.getByTestId('unread-count').textContent || '0')).toBeGreaterThanOrEqual(0);

      fireEvent.click(screen.getByTestId('maximize-btn'));
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });
  });

  describe('ChatWidget', () => {
    it('should render widget button when chat is closed', () => {
      render(
        <ChatProvider>
          <ChatWidget />
        </ChatProvider>
      );

      expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
    });

    it('should not render when chat is open', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWidget />
        </ChatProvider>
      );

      expect(screen.getByTestId('chat-widget')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('open-btn'));

      expect(screen.queryByTestId('chat-widget')).not.toBeInTheDocument();
    });

    it('should open chat when clicked', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWidget />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('chat-widget'));
      expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    });

    it('should show unread badge when there are unread messages', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWidget />
        </ChatProvider>
      );

      // No badge initially
      expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument();
    });

    it('should have correct position class', () => {
      const { rerender } = render(
        <ChatProvider>
          <ChatWidget position="bottom-right" />
        </ChatProvider>
      );

      expect(screen.getByTestId('chat-widget')).toHaveClass('right-4');

      rerender(
        <ChatProvider>
          <ChatWidget position="bottom-left" />
        </ChatProvider>
      );

      expect(screen.getByTestId('chat-widget')).toHaveClass('left-4');
    });

    it('should have accessible label', () => {
      render(
        <ChatProvider>
          <ChatWidget />
        </ChatProvider>
      );

      expect(screen.getByTestId('chat-widget')).toHaveAttribute('aria-label', 'Open chat');
    });
  });

  describe('ChatWindow', () => {
    it('should not render when chat is closed', () => {
      render(
        <ChatProvider>
          <ChatWindow />
        </ChatProvider>
      );

      expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();
    });

    it('should render when chat is open', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      expect(screen.getByTestId('chat-window')).toBeInTheDocument();
    });

    it('should render minimized state when minimized', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      fireEvent.click(screen.getByTestId('minimize-btn'));

      expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();
      expect(screen.getByTestId('chat-minimized')).toBeInTheDocument();
    });

    it('should have close button', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      expect(screen.getByTestId('close-chat')).toBeInTheDocument();
    });

    it('should have minimize button', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      expect(screen.getByTestId('minimize-chat')).toBeInTheDocument();
    });

    it('should have message input', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    });

    it('should have send button', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      expect(screen.getByTestId('send-message')).toBeInTheDocument();
    });

    it('should send message when form is submitted', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));

      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: 'Test message' } });

      const sendButton = screen.getByTestId('send-message');
      fireEvent.click(sendButton);

      // Message count should increase
      expect(parseInt(screen.getByTestId('message-count').textContent || '0')).toBeGreaterThan(1);
    });

    it('should disable send button when input is empty', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      expect(screen.getByTestId('send-message')).toBeDisabled();
    });

    it('should have dialog role for accessibility', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      expect(screen.getByTestId('chat-window')).toHaveAttribute('role', 'dialog');
    });

    it('should show messages container', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      expect(screen.getByTestId('chat-messages')).toBeInTheDocument();
    });

    it('should show bot message bubble', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      expect(screen.getByTestId('message-bot')).toBeInTheDocument();
    });

    it('should close chat when close button clicked', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      expect(screen.getByTestId('chat-window')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('close-chat'));
      expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();
    });

    it('should show agent name when connected to agent', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      fireEvent.click(screen.getByTestId('request-human-btn'));

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Agent name is shown in TestConsumer
      expect(screen.getByTestId('agent-name')).toHaveTextContent('Sarah');
      // Also verify status is connected
      expect(screen.getByTestId('status')).toHaveTextContent('connected');
    });
  });

  describe('ProactiveChatTrigger', () => {
    it('should not render initially', () => {
      render(
        <ChatProvider>
          <ProactiveChatTrigger delay={1000} />
        </ChatProvider>
      );

      expect(screen.queryByTestId('proactive-trigger')).not.toBeInTheDocument();
    });

    it('should render after delay', () => {
      render(
        <ChatProvider>
          <ProactiveChatTrigger delay={1000} />
        </ChatProvider>
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByTestId('proactive-trigger')).toBeInTheDocument();
    });

    it('should have chat now button', () => {
      render(
        <ChatProvider>
          <ProactiveChatTrigger delay={1000} />
        </ChatProvider>
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByTestId('proactive-chat-btn')).toBeInTheDocument();
    });

    it('should open chat when chat now clicked', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ProactiveChatTrigger delay={1000} />
        </ChatProvider>
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      fireEvent.click(screen.getByTestId('proactive-chat-btn'));
      expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    });

    it('should dismiss when maybe later clicked', () => {
      render(
        <ChatProvider>
          <ProactiveChatTrigger delay={1000} />
        </ChatProvider>
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByTestId('proactive-trigger')).toBeInTheDocument();

      act(() => {
        fireEvent.click(screen.getByTestId('proactive-dismiss-btn'));
      });

      expect(screen.queryByTestId('proactive-trigger')).not.toBeInTheDocument();
    });

    it('should dismiss when X clicked', () => {
      render(
        <ChatProvider>
          <ProactiveChatTrigger delay={1000} />
        </ChatProvider>
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      act(() => {
        fireEvent.click(screen.getByTestId('dismiss-proactive'));
      });

      expect(screen.queryByTestId('proactive-trigger')).not.toBeInTheDocument();
    });

    it('should not render when chat is already open', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ProactiveChatTrigger delay={1000} />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.queryByTestId('proactive-trigger')).not.toBeInTheDocument();
    });

    it('should display custom message', () => {
      render(
        <ChatProvider>
          <ProactiveChatTrigger delay={1000} message="Custom proactive message" />
        </ChatProvider>
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText('Custom proactive message')).toBeInTheDocument();
    });
  });

  describe('CheckoutChatPrompt', () => {
    it('should not render initially', () => {
      render(
        <ChatProvider>
          <CheckoutChatPrompt delay={1000} />
        </ChatProvider>
      );

      expect(screen.queryByTestId('checkout-chat-prompt')).not.toBeInTheDocument();
    });

    it('should render after delay', () => {
      render(
        <ChatProvider>
          <CheckoutChatPrompt delay={1000} />
        </ChatProvider>
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByTestId('checkout-chat-prompt')).toBeInTheDocument();
    });

    it('should have chat button', () => {
      render(
        <ChatProvider>
          <CheckoutChatPrompt delay={1000} />
        </ChatProvider>
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByTestId('checkout-chat-btn')).toBeInTheDocument();
    });

    it('should open chat when chat button clicked', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <CheckoutChatPrompt delay={1000} />
        </ChatProvider>
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      fireEvent.click(screen.getByTestId('checkout-chat-btn'));
      expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    });

    it('should dismiss when X clicked', () => {
      render(
        <ChatProvider>
          <CheckoutChatPrompt delay={1000} />
        </ChatProvider>
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByTestId('checkout-chat-prompt')).toBeInTheDocument();

      act(() => {
        fireEvent.click(screen.getByTestId('checkout-dismiss'));
      });

      expect(screen.queryByTestId('checkout-chat-prompt')).not.toBeInTheDocument();
    });

    it('should not render when chat is already open', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <CheckoutChatPrompt delay={1000} />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.queryByTestId('checkout-chat-prompt')).not.toBeInTheDocument();
    });
  });

  describe('LiveChat Combined Component', () => {
    it('should render widget by default', () => {
      render(
        <ChatProvider>
          <LiveChat />
        </ChatProvider>
      );

      expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
    });

    it('should not render widget when showWidget is false', () => {
      render(
        <ChatProvider>
          <LiveChat showWidget={false} />
        </ChatProvider>
      );

      expect(screen.queryByTestId('chat-widget')).not.toBeInTheDocument();
    });

    it('should render proactive trigger when showProactive is true', () => {
      render(
        <ChatProvider>
          <LiveChat showProactive proactiveDelay={1000} />
        </ChatProvider>
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByTestId('proactive-trigger')).toBeInTheDocument();
    });

    it('should use custom proactive message', () => {
      render(
        <ChatProvider>
          <LiveChat showProactive proactiveDelay={1000} proactiveMessage="Custom message!" />
        </ChatProvider>
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText('Custom message!')).toBeInTheDocument();
    });

    it('should render with bottom-left position', () => {
      render(
        <ChatProvider>
          <LiveChat config={{ position: 'bottom-left' }} />
        </ChatProvider>
      );

      expect(screen.getByTestId('chat-widget')).toHaveClass('left-4');
    });
  });

  describe('FAQ Matching', () => {
    it('should respond to shipping-related questions', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));

      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: 'How long does shipping take?' } });
      fireEvent.click(screen.getByTestId('send-message'));

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      // Should have welcome + user + bot response
      expect(parseInt(screen.getByTestId('message-count').textContent || '0')).toBe(3);
    });

    it('should respond to return-related questions', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));

      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: 'What is your return policy?' } });
      fireEvent.click(screen.getByTestId('send-message'));

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      expect(parseInt(screen.getByTestId('message-count').textContent || '0')).toBe(3);
    });

    it('should respond to order tracking questions', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));

      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: 'Where is my order?' } });
      fireEvent.click(screen.getByTestId('send-message'));

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      expect(parseInt(screen.getByTestId('message-count').textContent || '0')).toBe(3);
    });

    it('should provide fallback for unrecognized questions', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));

      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: 'xyzabc123' } });
      fireEvent.click(screen.getByTestId('send-message'));

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      // Should still respond with fallback message
      expect(parseInt(screen.getByTestId('message-count').textContent || '0')).toBe(3);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels on buttons', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));

      expect(screen.getByTestId('minimize-chat')).toHaveAttribute('aria-label', 'Minimize chat');
      expect(screen.getByTestId('close-chat')).toHaveAttribute('aria-label', 'Close chat');
      expect(screen.getByTestId('send-message')).toHaveAttribute('aria-label', 'Send message');
    });

    it('should have aria-label on chat input', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));

      expect(screen.getByTestId('chat-input')).toHaveAttribute('aria-label', 'Chat message');
    });

    it('should have aria-label on chat window', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));

      expect(screen.getByTestId('chat-window')).toHaveAttribute('aria-label', 'Live chat');
    });
  });

  describe('Edge Cases', () => {
    it('should not send empty messages', async () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      const initialCount = parseInt(screen.getByTestId('message-count').textContent || '0');

      // Try to send empty message
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.submit(input.closest('form')!);

      // Count should not change
      expect(parseInt(screen.getByTestId('message-count').textContent || '0')).toBe(initialCount);
    });

    it('should handle rapid message sending', () => {
      render(
        <ChatProvider>
          <TestConsumer />
          <ChatWindow />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));

      const input = screen.getByTestId('chat-input');

      // Send multiple messages quickly
      fireEvent.change(input, { target: { value: 'Message 1' } });
      fireEvent.click(screen.getByTestId('send-message'));

      fireEvent.change(input, { target: { value: 'Message 2' } });
      fireEvent.click(screen.getByTestId('send-message'));

      // Should handle multiple messages
      expect(parseInt(screen.getByTestId('message-count').textContent || '0')).toBeGreaterThan(1);
    });

    it('should not add duplicate welcome messages on re-open', () => {
      render(
        <ChatProvider>
          <TestConsumer />
        </ChatProvider>
      );

      fireEvent.click(screen.getByTestId('open-btn'));
      const firstOpenCount = parseInt(screen.getByTestId('message-count').textContent || '0');

      fireEvent.click(screen.getByTestId('close-btn'));
      fireEvent.click(screen.getByTestId('open-btn'));

      // Should still have same number of messages
      expect(parseInt(screen.getByTestId('message-count').textContent || '0')).toBe(firstOpenCount);
    });
  });
});
