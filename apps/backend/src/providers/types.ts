export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionRequest {
  systemPrompt: string;
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
  responseFormat?: 'text' | 'json';
}

export interface LLMCompletionResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  provider: 'anthropic' | 'openai' | 'google';
  latencyMs: number;
}

export interface LLMProvider {
  name: 'anthropic' | 'openai' | 'google';
  availableModels(): string[];
  complete(model: string, req: LLMCompletionRequest): Promise<LLMCompletionResponse>;
}
