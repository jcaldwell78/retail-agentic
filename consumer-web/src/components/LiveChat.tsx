import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from 'react';
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  User,
  Bot,
  Phone,
  HelpCircle,
  ChevronDown,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export type MessageRole = 'user' | 'bot' | 'agent';
export type ChatStatus = 'idle' | 'waiting' | 'connected' | 'closed';
export type SuggestedAction = 'faq' | 'order-status' | 'returns' | 'shipping' | 'human';

export interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  isTyping?: boolean;
  actions?: QuickAction[];
}

export interface QuickAction {
  id: string;
  label: string;
  action: SuggestedAction | string;
}

export interface ChatAgent {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
}

export interface ChatConfig {
  botName?: string;
  welcomeMessage?: string;
  offlineMessage?: string;
  proactiveDelay?: number; // ms before showing proactive prompt
  proactiveEnabled?: boolean;
  proactivePages?: string[]; // paths where proactive chat is enabled
  checkoutAbandonmentDelay?: number; // ms on checkout before prompting
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  showTypingIndicator?: boolean;
}

interface ChatContextValue {
  isOpen: boolean;
  isMinimized: boolean;
  messages: ChatMessage[];
  status: ChatStatus;
  agent: ChatAgent | null;
  unreadCount: number;
  openChat: () => void;
  closeChat: () => void;
  minimizeChat: () => void;
  maximizeChat: () => void;
  sendMessage: (content: string) => void;
  requestHumanAgent: () => void;
  clearChat: () => void;
  handleQuickAction: (action: SuggestedAction | string) => void;
}

// ============================================================================
// FAQ Database (AI Chatbot Knowledge Base)
// ============================================================================

interface FAQItem {
  keywords: string[];
  question: string;
  answer: string;
  followUp?: QuickAction[];
}

const FAQ_DATABASE: FAQItem[] = [
  {
    keywords: ['shipping', 'delivery', 'ship', 'arrive', 'when'],
    question: 'How long does shipping take?',
    answer: 'Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days. Free shipping is available on orders over $50.',
    followUp: [
      { id: 'track', label: 'Track my order', action: 'order-status' },
      { id: 'human', label: 'Talk to agent', action: 'human' },
    ],
  },
  {
    keywords: ['return', 'refund', 'exchange', 'money back'],
    question: 'What is your return policy?',
    answer: 'We offer a 30-day hassle-free return policy. Items must be unused and in original packaging. Refunds are processed within 5-7 business days after we receive your return.',
    followUp: [
      { id: 'start-return', label: 'Start a return', action: 'returns' },
      { id: 'human', label: 'Talk to agent', action: 'human' },
    ],
  },
  {
    keywords: ['order', 'status', 'track', 'where', 'package'],
    question: 'Where is my order?',
    answer: 'You can track your order by clicking "Track my order" below or by logging into your account and viewing your order history. You\'ll need your order number and email address.',
    followUp: [
      { id: 'track', label: 'Track my order', action: 'order-status' },
      { id: 'human', label: 'Talk to agent', action: 'human' },
    ],
  },
  {
    keywords: ['payment', 'pay', 'credit card', 'paypal', 'accepted'],
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, Apple Pay, and Google Pay. All transactions are secure and encrypted.',
    followUp: [
      { id: 'human', label: 'Talk to agent', action: 'human' },
    ],
  },
  {
    keywords: ['size', 'sizing', 'fit', 'measurement'],
    question: 'How do I find my size?',
    answer: 'Check our Size Guide on any product page for detailed measurements. If you\'re between sizes, we recommend sizing up for a more comfortable fit.',
    followUp: [
      { id: 'human', label: 'Talk to agent', action: 'human' },
    ],
  },
  {
    keywords: ['discount', 'coupon', 'promo', 'code', 'sale'],
    question: 'Do you have any discounts?',
    answer: 'Sign up for our newsletter to get 10% off your first order! We also run seasonal sales and special promotions. Check our homepage for current offers.',
    followUp: [
      { id: 'human', label: 'Talk to agent', action: 'human' },
    ],
  },
  {
    keywords: ['cancel', 'order', 'stop'],
    question: 'Can I cancel my order?',
    answer: 'Orders can be cancelled within 1 hour of placement. After that, the order enters our fulfillment process. Please contact our support team immediately if you need to cancel.',
    followUp: [
      { id: 'human', label: 'Cancel my order', action: 'human' },
    ],
  },
  {
    keywords: ['contact', 'phone', 'email', 'support', 'help'],
    question: 'How can I contact support?',
    answer: 'You can reach us via this chat, email at support@store.com, or call 1-800-STORE (Mon-Fri 9am-6pm EST). We typically respond within 24 hours.',
    followUp: [
      { id: 'human', label: 'Talk to agent now', action: 'human' },
    ],
  },
];

// ============================================================================
// Context
// ============================================================================

const ChatContext = createContext<ChatContextValue | null>(null);

export function useLiveChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useLiveChat must be used within a ChatProvider');
  }
  return context;
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function findFAQMatch(input: string): FAQItem | null {
  const normalizedInput = input.toLowerCase();

  for (const faq of FAQ_DATABASE) {
    const matchCount = faq.keywords.filter(keyword =>
      normalizedInput.includes(keyword.toLowerCase())
    ).length;

    if (matchCount >= 1) {
      return faq;
    }
  }

  return null;
}

function getDefaultWelcomeMessage(botName: string): ChatMessage {
  return {
    id: generateId(),
    content: `Hi there! I'm ${botName}, your virtual assistant. How can I help you today?`,
    role: 'bot',
    timestamp: new Date(),
    actions: [
      { id: 'shipping', label: 'Shipping info', action: 'shipping' },
      { id: 'returns', label: 'Returns & refunds', action: 'returns' },
      { id: 'order', label: 'Order status', action: 'order-status' },
      { id: 'human', label: 'Talk to human', action: 'human' },
    ],
  };
}

// ============================================================================
// ChatProvider
// ============================================================================

interface ChatProviderProps {
  children: ReactNode;
  config?: ChatConfig;
  onSendMessage?: (message: string) => void;
  onRequestHumanAgent?: () => void;
  onChatOpen?: () => void;
  onChatClose?: () => void;
}

export function ChatProvider({
  children,
  config = {},
  onSendMessage,
  onRequestHumanAgent,
  onChatOpen,
  onChatClose,
}: ChatProviderProps) {
  const {
    botName = 'ShopBot',
    welcomeMessage,
    offlineMessage = 'Our team is currently offline. Please leave a message and we\'ll get back to you soon.',
    proactiveDelay = 30000,
    proactiveEnabled = false,
    proactivePages = ['/checkout', '/cart'],
    checkoutAbandonmentDelay = 60000,
    showTypingIndicator = true,
  } = config;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [agent, setAgent] = useState<ChatAgent | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [proactiveShown, setProactiveShown] = useState(false);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      const welcome = welcomeMessage
        ? { id: generateId(), content: welcomeMessage, role: 'bot' as const, timestamp: new Date() }
        : getDefaultWelcomeMessage(botName);
      setMessages([welcome]);
      setHasInitialized(true);
    }
  }, [isOpen, hasInitialized, welcomeMessage, botName]);

  // Proactive chat trigger
  useEffect(() => {
    if (!proactiveEnabled || proactiveShown || isOpen) return;

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const shouldShowProactive = proactivePages.some(page => currentPath.includes(page));

    if (!shouldShowProactive) return;

    const delay = currentPath.includes('/checkout') ? checkoutAbandonmentDelay : proactiveDelay;

    const timer = setTimeout(() => {
      setProactiveShown(true);
      setUnreadCount(1);
      // Show a proactive message preview
      const proactiveMessage: ChatMessage = {
        id: generateId(),
        content: currentPath.includes('/checkout')
          ? 'Need help completing your order? I\'m here to assist!'
          : 'Hi! Looking for something? I can help you find what you need.',
        role: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, proactiveMessage]);
    }, delay);

    return () => clearTimeout(timer);
  }, [proactiveEnabled, proactiveShown, isOpen, proactivePages, proactiveDelay, checkoutAbandonmentDelay]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
    onChatOpen?.();
  }, [onChatOpen]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    onChatClose?.();
  }, [onChatClose]);

  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const maximizeChat = useCallback(() => {
    setIsMinimized(false);
    setUnreadCount(0);
  }, []);

  const addBotMessage = useCallback((content: string, actions?: QuickAction[]) => {
    const message: ChatMessage = {
      id: generateId(),
      content,
      role: 'bot',
      timestamp: new Date(),
      actions,
    };
    setMessages(prev => [...prev, message]);

    if (isMinimized) {
      setUnreadCount(prev => prev + 1);
    }
  }, [isMinimized]);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    onSendMessage?.(content);

    // If connected to human agent, don't process with bot
    if (status === 'connected' && agent) {
      return;
    }

    // Show typing indicator
    const typingId = `typing-${Date.now()}`;
    if (showTypingIndicator) {
      const typingMessage: ChatMessage = {
        id: typingId,
        content: '',
        role: 'bot',
        timestamp: new Date(),
        isTyping: true,
      };
      setMessages(prev => [...prev, typingMessage]);
    }

    // Simulate bot response delay
    setTimeout(() => {
      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== typingId));

      // Find FAQ match or provide default response
      const faqMatch = findFAQMatch(content);

      if (faqMatch) {
        addBotMessage(faqMatch.answer, faqMatch.followUp);
      } else {
        addBotMessage(
          "I'm not sure I understand. Could you please rephrase your question? Or you can select from the options below:",
          [
            { id: 'shipping', label: 'Shipping info', action: 'shipping' },
            { id: 'returns', label: 'Returns & refunds', action: 'returns' },
            { id: 'order', label: 'Order status', action: 'order-status' },
            { id: 'human', label: 'Talk to human', action: 'human' },
          ]
        );
      }
    }, 1000);
  }, [status, agent, showTypingIndicator, onSendMessage, addBotMessage]);

  const handleQuickAction = useCallback((action: SuggestedAction | string) => {
    switch (action) {
      case 'shipping':
        sendMessage('Tell me about shipping');
        break;
      case 'returns':
        sendMessage('What is your return policy?');
        break;
      case 'order-status':
        addBotMessage(
          'To check your order status, please visit your account page or enter your order number and email. Would you like me to connect you with an agent to help?',
          [
            { id: 'human', label: 'Yes, connect me', action: 'human' },
            { id: 'no', label: 'No thanks', action: 'dismiss' },
          ]
        );
        break;
      case 'human':
        requestHumanAgent();
        break;
      case 'faq':
        addBotMessage(
          'Here are some frequently asked questions:',
          [
            { id: 'shipping', label: 'Shipping info', action: 'shipping' },
            { id: 'returns', label: 'Returns & refunds', action: 'returns' },
            { id: 'order', label: 'Order status', action: 'order-status' },
            { id: 'payment', label: 'Payment methods', action: 'payment' },
          ]
        );
        break;
      case 'payment':
        sendMessage('What payment methods do you accept?');
        break;
      case 'dismiss':
        addBotMessage('No problem! Let me know if you need anything else.');
        break;
      default:
        // Custom action handling
        break;
    }
  }, [sendMessage, addBotMessage]);

  const requestHumanAgent = useCallback(() => {
    setStatus('waiting');
    onRequestHumanAgent?.();

    addBotMessage(
      'I\'m connecting you with a customer support agent. Please wait a moment...'
    );

    // Simulate agent connection (in real app, this would be a WebSocket/API call)
    setTimeout(() => {
      const mockAgent: ChatAgent = {
        id: 'agent-1',
        name: 'Sarah',
        isOnline: true,
      };
      setAgent(mockAgent);
      setStatus('connected');

      const agentMessage: ChatMessage = {
        id: generateId(),
        content: `Hi! I'm ${mockAgent.name} from customer support. How can I help you today?`,
        role: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
    }, 2000);
  }, [onRequestHumanAgent, addBotMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setHasInitialized(false);
    setStatus('idle');
    setAgent(null);
  }, []);

  const value: ChatContextValue = {
    isOpen,
    isMinimized,
    messages,
    status,
    agent,
    unreadCount,
    openChat,
    closeChat,
    minimizeChat,
    maximizeChat,
    sendMessage,
    requestHumanAgent,
    clearChat,
    handleQuickAction,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// ============================================================================
// ChatWidget (Floating Button)
// ============================================================================

interface ChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  className?: string;
}

export function ChatWidget({ position = 'bottom-right', className }: ChatWidgetProps) {
  const { isOpen, openChat, unreadCount } = useLiveChat();

  if (isOpen) return null;

  return (
    <Button
      onClick={openChat}
      className={cn(
        'fixed z-50 h-14 w-14 rounded-full shadow-lg',
        position === 'bottom-right' ? 'right-4 bottom-4' : 'left-4 bottom-4',
        className
      )}
      size="icon"
      data-testid="chat-widget"
      aria-label={`Open chat${unreadCount > 0 ? ` (${unreadCount} unread messages)` : ''}`}
    >
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
          data-testid="unread-badge"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  );
}

// ============================================================================
// ChatWindow
// ============================================================================

interface ChatWindowProps {
  position?: 'bottom-right' | 'bottom-left';
  className?: string;
}

export function ChatWindow({ position = 'bottom-right', className }: ChatWindowProps) {
  const {
    isOpen,
    isMinimized,
    messages,
    status,
    agent,
    closeChat,
    minimizeChat,
    maximizeChat,
    sendMessage,
    handleQuickAction,
  } = useLiveChat();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <Button
        onClick={maximizeChat}
        className={cn(
          'fixed z-50 h-14 rounded-full shadow-lg px-4',
          position === 'bottom-right' ? 'right-4 bottom-4' : 'left-4 bottom-4'
        )}
        data-testid="chat-minimized"
      >
        <MessageCircle className="h-5 w-5 mr-2" />
        <span>Chat</span>
        <Maximize2 className="h-4 w-4 ml-2" />
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        'fixed z-50 w-80 sm:w-96 h-[500px] flex flex-col shadow-2xl',
        position === 'bottom-right' ? 'right-4 bottom-4' : 'left-4 bottom-4',
        className
      )}
      data-testid="chat-window"
      role="dialog"
      aria-label="Live chat"
    >
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          {status === 'connected' && agent ? (
            <>
              <div className="relative">
                <User className="h-8 w-8 p-1 bg-primary-foreground/20 rounded-full" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-400 rounded-full border-2 border-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{agent.name}</p>
                <p className="text-xs opacity-80">Customer Support</p>
              </div>
            </>
          ) : (
            <>
              <Bot className="h-8 w-8 p-1 bg-primary-foreground/20 rounded-full" />
              <div>
                <p className="font-semibold text-sm">ShopBot</p>
                <p className="text-xs opacity-80">
                  {status === 'waiting' ? 'Connecting...' : 'Online'}
                </p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={minimizeChat}
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            aria-label="Minimize chat"
            data-testid="minimize-chat"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeChat}
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            aria-label="Close chat"
            data-testid="close-chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-3 space-y-3" data-testid="chat-messages">
        {messages.map((message) => (
          <div key={message.id}>
            {message.isTyping ? (
              <TypingIndicator />
            ) : (
              <ChatBubble
                message={message}
                onActionClick={handleQuickAction}
              />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <CardFooter className="p-3 border-t">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            data-testid="chat-input"
            aria-label="Chat message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim()}
            data-testid="send-message"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// ChatBubble
// ============================================================================

interface ChatBubbleProps {
  message: ChatMessage;
  onActionClick?: (action: SuggestedAction | string) => void;
}

function ChatBubble({ message, onActionClick }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isAgent = message.role === 'agent';

  return (
    <div
      className={cn(
        'flex',
        isUser ? 'justify-end' : 'justify-start'
      )}
      data-testid={`message-${message.role}`}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2',
          isUser
            ? 'bg-primary text-primary-foreground'
            : isAgent
            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
            : 'bg-muted'
        )}
      >
        {(isAgent || (!isUser && message.role === 'bot')) && (
          <div className="flex items-center gap-1 mb-1">
            {isAgent ? (
              <User className="h-3 w-3" />
            ) : (
              <Bot className="h-3 w-3" />
            )}
            <span className="text-xs font-medium">
              {isAgent ? 'Agent' : 'ShopBot'}
            </span>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className="text-xs opacity-60 mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>

        {/* Quick Actions */}
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.actions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => onActionClick?.(action.action)}
                className="text-xs h-7"
                data-testid={`quick-action-${action.id}`}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TypingIndicator
// ============================================================================

function TypingIndicator() {
  return (
    <div className="flex justify-start" data-testid="typing-indicator">
      <div className="bg-muted rounded-lg px-4 py-2">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ProactiveChatTrigger
// ============================================================================

interface ProactiveChatTriggerProps {
  message?: string;
  delay?: number;
  showOnPages?: string[];
  className?: string;
}

export function ProactiveChatTrigger({
  message = "Hi! Need help finding something?",
  delay = 30000,
  showOnPages = [],
  className,
}: ProactiveChatTriggerProps) {
  const { isOpen, openChat } = useLiveChat();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isOpen || isDismissed) return;

    // Check if current page is in showOnPages
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    if (showOnPages.length > 0 && !showOnPages.some(page => currentPath.includes(page))) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isOpen, isDismissed, delay, showOnPages]);

  if (!isVisible || isOpen || isDismissed) return null;

  return (
    <div
      className={cn(
        'fixed bottom-20 right-4 z-50 max-w-xs animate-in slide-in-from-bottom-5 fade-in',
        className
      )}
      data-testid="proactive-trigger"
    >
      <Card className="shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Bot className="h-8 w-8 p-1 bg-primary/10 text-primary rounded-full flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">ShopBot</p>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={() => setIsDismissed(true)}
              aria-label="Dismiss"
              data-testid="dismiss-proactive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              onClick={openChat}
              className="flex-1"
              data-testid="proactive-chat-btn"
            >
              Chat now
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDismissed(true)}
              data-testid="proactive-dismiss-btn"
            >
              Maybe later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// CheckoutChatPrompt
// ============================================================================

interface CheckoutChatPromptProps {
  delay?: number;
  className?: string;
}

export function CheckoutChatPrompt({ delay = 60000, className }: CheckoutChatPromptProps) {
  const { isOpen, openChat } = useLiveChat();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isOpen || isDismissed) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isOpen, isDismissed, delay]);

  if (!isVisible || isOpen || isDismissed) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-bottom-5 fade-in',
        className
      )}
      data-testid="checkout-chat-prompt"
    >
      <Card className="shadow-lg border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Need help with your order?</p>
              <p className="text-xs text-muted-foreground">
                Our team is ready to assist with checkout
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={openChat}
                data-testid="checkout-chat-btn"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Chat
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsDismissed(true)}
                className="h-8 w-8"
                aria-label="Dismiss"
                data-testid="checkout-dismiss"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// LiveChat (Combined Component)
// ============================================================================

interface LiveChatProps {
  config?: ChatConfig;
  showWidget?: boolean;
  showProactive?: boolean;
  proactiveMessage?: string;
  proactiveDelay?: number;
  proactivePages?: string[];
  onSendMessage?: (message: string) => void;
  onRequestHumanAgent?: () => void;
  className?: string;
}

export function LiveChat({
  config,
  showWidget = true,
  showProactive = false,
  proactiveMessage,
  proactiveDelay,
  proactivePages,
  onSendMessage,
  onRequestHumanAgent,
  className,
}: LiveChatProps) {
  const position = config?.position || 'bottom-right';

  return (
    <>
      {showWidget && <ChatWidget position={position} className={className} />}
      <ChatWindow position={position} />
      {showProactive && (
        <ProactiveChatTrigger
          message={proactiveMessage}
          delay={proactiveDelay}
          showOnPages={proactivePages}
        />
      )}
    </>
  );
}

// ============================================================================
// Export all components
// ============================================================================

export {
  ChatContext,
  type ChatContextValue,
  type ChatConfig,
  type ChatMessage,
  type ChatAgent,
  type ChatStatus,
};
