# Advanced Chat System Context - Time AI Implementation

## Overview
บริบทและแนวทางการปรับปรุงระบบ Chat AI ของ Time AI โดยใช้แนวคิดจากการวิเคราะห์ระบบ Scira_DP ที่มีความทันสมัยและมีประสิทธิภาพสูง

## Current Time AI Chat System Architecture

### ปัจจุบันของระบบ Chat AI Time AI:
- **Frontend**: React-based Chat AI components (ChatAI, Message, ChatInput, ChatArea, Loading)
- **Backend**: Firebase Firestore สำหรับเก็บประวัติการสนทนา
- **Authentication**: Firebase Auth ผ่าน AuthGuard component
- **Service Integration**: toolsService สำหรับส่งข้อความและรับการตอบกลับ
- **Features**: Real-time chat, auto-scrolling, loading indicators, conversation history management

## Advanced Features to Implement (Based on Scira Analysis)

### 1. Core Chat Hook Architecture Enhancement

#### ปัจจุบัน: Basic chat implementation
```typescript
// Current basic implementation
const sendMessage = async (message: string) => {
  // Basic message sending
};
```

#### แนะนำ: Advanced useChat Hook with Vercel AI SDK
```typescript
import { useChat } from '@ai-sdk/react';

interface AdvancedChatHook {
  messages: ChatMessage[];
  sendMessage: (message: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  regenerate: () => void;
  stop: () => void;
  status: 'idle' | 'streaming' | 'ready';
  error: Error | null;
  resumeStream: () => void;
}

const useAdvancedChat = (chatId: string): AdvancedChatHook => {
  const {
    messages,
    sendMessage,
    setMessages,
    regenerate,
    stop,
    status,
    error,
    resumeStream
  } = useChat<ChatMessage>({
    id: chatId,
    api: '/api/chat',
    experimental_throttle: 50, // Smart throttling
    onData: (dataPart) => {
      // Handle streaming data
      setDataStream((ds) => [...ds, dataPart]);
    },
    onFinish: async ({ message }) => {
      // Save to Firebase Firestore
      await saveConversationToFirestore(chatId, message);
      // Update usage tracking
      await updateUsageTracking(user.uid);
    },
    onError: (error) => {
      // Enhanced error handling
      handleChatError(error);
    },
  });

  return {
    messages,
    sendMessage,
    setMessages,
    regenerate,
    stop,
    status,
    error,
    resumeStream
  };
};
```

### 2. Advanced State Management

#### แนะนำ: Chat State Reducer Pattern
```typescript
// types/chat.ts
interface ChatState {
  hasSubmitted: boolean;
  hasManuallyScrolled: boolean;
  showUpgradeDialog: boolean;
  showSignInPrompt: boolean;
  suggestedQuestions: string[];
  attachments: Attachment[];
  selectedVisibilityType: 'public' | 'private';
  isLoading: boolean;
  streamingMessageId: string | null;
}

type ChatStateAction = 
  | { type: 'SET_HAS_SUBMITTED'; payload: boolean }
  | { type: 'SET_HAS_MANUALLY_SCROLLED'; payload: boolean }
  | { type: 'SET_SHOW_UPGRADE_DIALOG'; payload: boolean }
  | { type: 'SET_SUGGESTED_QUESTIONS'; payload: string[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STREAMING_MESSAGE_ID'; payload: string | null };

// hooks/useChatState.ts
const chatStateReducer = (state: ChatState, action: ChatStateAction): ChatState => {
  switch (action.type) {
    case 'SET_HAS_SUBMITTED':
      return { ...state, hasSubmitted: action.payload };
    case 'SET_HAS_MANUALLY_SCROLLED':
      return { ...state, hasManuallyScrolled: action.payload };
    case 'SET_SHOW_UPGRADE_DIALOG':
      return { ...state, showUpgradeDialog: action.payload };
    case 'SET_SUGGESTED_QUESTIONS':
      return { ...state, suggestedQuestions: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_STREAMING_MESSAGE_ID':
      return { ...state, streamingMessageId: action.payload };
    default:
      return state;
  }
};

export const useChatState = () => {
  const [state, dispatch] = useReducer(chatStateReducer, {
    hasSubmitted: false,
    hasManuallyScrolled: false,
    showUpgradeDialog: false,
    showSignInPrompt: false,
    suggestedQuestions: [],
    attachments: [],
    selectedVisibilityType: 'private',
    isLoading: false,
    streamingMessageId: null,
  });

  return { state, dispatch };
};
```

### 3. Real-time Streaming Implementation

#### API Route Enhancement
```typescript
// pages/api/chat.ts หรือ app/api/chat/route.ts
import { createUIMessageStream } from 'ai';
import { ChatMessage } from '@/types/chat';

export async function POST(request: Request) {
  const { messages, chatId, userId } = await request.json();

  // Check user subscription and limits
  const canProceed = await checkUserLimits(userId);
  if (!canProceed) {
    return new Response('Usage limit exceeded', { status: 429 });
  }

  const stream = createUIMessageStream<ChatMessage>({
    execute: async ({ writer: dataStream }) => {
      const result = streamText({
        model: openai('gpt-4-turbo'), // หรือ model ที่คุณใช้
        messages: convertToModelMessages(messages),
        system: "You are a helpful AI assistant for Time AI platform.",
        onFinish: async (event) => {
          // Save to Firestore
          await saveMessageToFirestore({
            chatId,
            userId,
            message: event.text,
            timestamp: new Date(),
            role: 'assistant'
          });
          
          // Update usage tracking
          await updateUsageAnalytics(userId, {
            requestCount: 1,
            tokensUsed: event.usage?.totalTokens || 0
          });
        },
      });
      
      dataStream.merge(result.toUIMessageStream());
    },
  });

  return new Response(stream.toDataStreamResponse());
}
```

### 4. Advanced Auto-scroll Management

```typescript
// hooks/useAutoScroll.ts
export const useAutoScroll = (messagesRef: RefObject<HTMLDivElement>, status: string) => {
  const [hasManuallyScrolled, setHasManuallyScrolled] = useState(false);

  useEffect(() => {
    const scrollContainer = messagesRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      // ตรวจจับการเลื่อนด้วยตนเองระหว่าง streaming
      if (!isNearBottom && status === 'streaming') {
        setHasManuallyScrolled(true);
      }
    };

    // Auto-scroll logic
    const autoScroll = () => {
      if (status === 'streaming' && !hasManuallyScrolled) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    
    // Auto-scroll when new messages arrive
    const observer = new MutationObserver(autoScroll);
    observer.observe(scrollContainer, { childList: true, subtree: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [status, hasManuallyScrolled]);

  // Reset manual scroll when starting new conversation
  const resetScroll = () => setHasManuallyScrolled(false);

  return { hasManuallyScrolled, resetScroll };
};
```

### 5. Enhanced Message Rendering

```typescript
// components/MessageRenderer.tsx
interface MessagePartRendererProps {
  part: MessagePart;
  messageIndex: number;
  status: string;
  onHighlight?: (text: string) => void;
}

export const MessagePartRenderer: React.FC<MessagePartRendererProps> = ({
  part,
  messageIndex,
  status,
  onHighlight
}) => {
  // Handle different message types
  if (part.type === 'text') {
    return (
      <div className="message-text">
        {status === 'streaming' && (!part.text || part.text.trim() === '') ? (
          <StreamingIndicator />
        ) : (
          <MarkdownRenderer 
            content={part.text} 
            onHighlight={onHighlight}
          />
        )}
      </div>
    );
  }

  if (part.type === 'tool-invocation') {
    return <ToolInvocationRenderer part={part} />;
  }

  if (part.type === 'data') {
    return <DataPartRenderer part={part} />;
  }

  return null;
};

// Streaming indicator component
const StreamingIndicator = () => (
  <div className="flex space-x-2">
    {[0, 1, 2].map((index) => (
      <div
        key={index}
        className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
        style={{ animationDelay: `${index * 150}ms` }}
      />
    ))}
  </div>
);
```

### 6. Firebase Firestore Integration Enhancement

```typescript
// services/firestoreService.ts
import { 
  doc, 
  addDoc, 
  collection, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export class AdvancedFirestoreService {
  // Enhanced conversation saving
  static async saveConversation(conversation: Conversation) {
    try {
      const conversationRef = await addDoc(collection(db, 'conversations'), {
        userId: conversation.userId,
        title: conversation.title,
        messages: conversation.messages,
        metadata: {
          messageCount: conversation.messages.length,
          lastMessageAt: serverTimestamp(),
          tokensUsed: conversation.metadata?.tokensUsed || 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      console.log('Conversation saved with ID:', '(ID hidden for security)');
      return conversationRef.id;
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }

  // Enhanced message saving with streaming support
  static async saveStreamingMessage(
    conversationId: string, 
    message: Partial<Message>
  ) {
    try {
      const messageData = {
        ...message,
        timestamp: serverTimestamp(),
        conversationId,
      };

      // Handle document reference with proper error handling
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        messages: arrayUnion(messageData),
        updatedAt: serverTimestamp(),
        'metadata.lastMessageAt': serverTimestamp(),
      });

    } catch (error) {
      console.error('Error saving streaming message:', error);
      // Implement retry logic
      throw error;
    }
  }

  // Enhanced usage tracking
  static async updateUsageTracking(userId: string, usage: UsageData) {
    try {
      const usageRef = doc(db, 'usage_tracking', userId);
      await updateDoc(usageRef, {
        requestCount: increment(usage.requestCount || 1),
        tokensUsed: increment(usage.tokensUsed || 0),
        lastRequestAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating usage tracking:', error);
      // Ensure anti-abuse protection works correctly
      throw error;
    }
  }
}
```

### 7. Error Handling Enhancement

```typescript
// hooks/useErrorHandling.ts
export const useErrorHandling = () => {
  const [error, setError] = useState<Error | null>(null);

  const handleChatError = useCallback((error: Error) => {
    console.error('Chat error:', error);
    
    if (error.message?.includes('rate limit')) {
      // Show upgrade dialog for rate limit
      setShowUpgradeDialog(true);
    } else if (error.message?.includes('unauthorized')) {
      // Show sign-in prompt
      setShowSignInPrompt(true);
    } else if (error.message?.includes('network')) {
      // Handle network errors
      setError(new Error('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง'));
    } else {
      // Generic error handling
      setError(error);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleChatError, clearError };
};
```

### 8. Performance Optimization

```typescript
// hooks/useOptimizedChat.ts
import { memo, useMemo, useCallback } from 'react';

// Memoized message component
export const Message = memo<MessageProps>(({ 
  message, 
  index, 
  onHighlight 
}) => {
  const renderedContent = useMemo(() => {
    return <MessagePartRenderer part={message} onHighlight={onHighlight} />;
  }, [message.content, message.id]);

  return <div className="message">{renderedContent}</div>;
});

// Optimized message list with virtualization for long conversations
export const MessageList = memo<MessageListProps>(({ 
  messages, 
  status 
}) => {
  const memoizedMessages = useMemo(() => {
    return messages.map((message, index) => (
      <Message 
        key={message.id} 
        message={message} 
        index={index}
      />
    ));
  }, [messages]);

  return (
    <div className="message-list">
      {memoizedMessages}
      {status === 'streaming' && <StreamingIndicator />}
    </div>
  );
});
```

## Implementation Priority

### Phase 1: Core Infrastructure
1. ✅ Implement advanced useChat hook with Vercel AI SDK
2. ✅ Set up state management with reducer pattern
3. ✅ Enhance Firebase Firestore integration
4. ✅ Implement comprehensive error handling

### Phase 2: User Experience
1. ✅ Advanced auto-scroll management
2. ✅ Enhanced message rendering system
3. ✅ Real-time streaming implementation
4. ✅ Performance optimizations

### Phase 3: Advanced Features
1. 🔄 Tool integration system
2. 🔄 Advanced UI components
3. 🔄 Analytics and monitoring
4. 🔄 Advanced subscription integration

## Integration with Current Time AI Components

### การผสานกับคอมโพเนนต์ปัจจุบัน:

1. **ChatAI Component**: เป็น main container ที่จะใช้ advanced useChat hook
2. **Message Component**: ปรับปรุงให้ใช้ MessagePartRenderer ใหม่
3. **ChatInput Component**: เพิ่ม advanced features เช่น throttling และ error handling
4. **ChatArea Component**: ใช้ auto-scroll management ใหม่
5. **Loading Component**: ปรับปรุงให้แสดง streaming indicators

### Firebase Integration:
- ใช้ AdvancedFirestoreService สำหรับ conversation management
- เพิ่ม enhanced usage tracking
- ปรับปรุง security rules สำหรับ real-time features

## Testing Strategy

### Unit Tests:
```typescript
// __tests__/useAdvancedChat.test.ts
describe('useAdvancedChat', () => {
  it('should handle message sending correctly', async () => {
    // Test implementation
  });

  it('should manage streaming state properly', async () => {
    // Test implementation
  });

  it('should handle errors gracefully', async () => {
    // Test implementation
  });
});
```

### Integration Tests:
- Test Firebase Firestore operations
- Test real-time streaming functionality
- Test error handling and recovery
- Test performance under load

## Security Considerations

1. **Input Validation**: ตรวจสอบ input ทุกครั้งก่อนส่งไป API
2. **Rate Limiting**: ใช้ subscription-based rate limiting
3. **Error Information**: ไม่เปิดเผยข้อมูลสำคัญใน error messages
4. **Firebase Security Rules**: ปรับปรุง rules สำหรับ real-time features

## Monitoring and Analytics

1. **Usage Tracking**: ติดตาม token usage และ request counts
2. **Performance Monitoring**: วัด response times และ streaming performance
3. **Error Tracking**: บันทึกและวิเคราะห์ข้อผิดพลาด
4. **User Engagement**: ติดตาม conversation patterns และ user satisfaction

---

*หมายเหตุ: บริบทนี้จะช่วยให้การพัฒนาระบบ Chat AI ของ Time AI มีความทันสมัยและมีประสิทธิภาพสูงขึ้น โดยใช้แนวคิดที่ได้จากการวิเคราะห์ระบบ Scira_DP ที่มีความซับซ้อนและมีฟีเจอร์ขั้นสูง*