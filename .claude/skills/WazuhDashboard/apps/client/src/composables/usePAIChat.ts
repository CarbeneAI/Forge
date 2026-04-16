import { ref } from 'vue';
import type { WazuhAlert, ChatMessage, ChatResponse, QuickPrompts } from '../types';

function getApiUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4001';
  }
  return 'https://wazuh-dashboard-api.home.yourdomain.com';
}

const API_URL = getApiUrl();

export function usePAIChat() {
  const messages = ref<ChatMessage[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const quickPrompts = ref<QuickPrompts | null>(null);

  // Load quick prompts
  const loadPrompts = async () => {
    try {
      const response = await fetch(`${API_URL}/chat/prompts`);
      if (response.ok) {
        quickPrompts.value = await response.json();
      }
    } catch (err) {
      console.error('Failed to load prompts:', err);
    }
  };

  // Send message to PAI
  const sendMessage = async (
    content: string,
    alertContext?: WazuhAlert[]
  ): Promise<boolean> => {
    if (!content.trim()) return false;

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    messages.value.push(userMessage);

    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          history: messages.value.slice(0, -1).map(m => ({
            role: m.role,
            content: m.content,
          })),
          alertContext,
          sessionId: 'wazuh-dashboard',
        }),
      });

      const data: ChatResponse = await response.json();

      if (data.success && data.content) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.content,
          timestamp: Date.now(),
        };
        messages.value.push(assistantMessage);
        return true;
      } else {
        error.value = data.error || 'Failed to get response';
        return false;
      }
    } catch (err) {
      console.error('Chat error:', err);
      error.value = 'Failed to send message';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Quick action with predefined prompt
  const quickAction = async (
    action: keyof QuickPrompts,
    alertContext?: WazuhAlert[]
  ): Promise<boolean> => {
    const prompt = quickPrompts.value?.[action];
    if (!prompt) {
      error.value = 'Prompt not available';
      return false;
    }
    return sendMessage(prompt, alertContext);
  };

  // Clear chat history
  const clearChat = () => {
    messages.value = [];
    error.value = null;
  };

  // Initialize
  loadPrompts();

  return {
    messages,
    isLoading,
    error,
    quickPrompts,
    sendMessage,
    quickAction,
    clearChat,
  };
}
