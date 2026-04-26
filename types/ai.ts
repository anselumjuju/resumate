export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.5-flash-lite';

export interface GeminiKeyConfig {
  id: string;
  key: string;
  usageByModel: Record<GeminiModel, number>;
  label?: string;
}

export interface GeminiState {
  keys: GeminiKeyConfig[];
  activeKeyId: string | null;
  selectedModel: GeminiModel;
  autoSwitch: boolean;
  lastResetAt?: number;
}
