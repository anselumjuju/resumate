import { GEMINI_MODELS } from '@/constants/models';

export type GeminiModel = (typeof GEMINI_MODELS)[number]['id'];

export interface GeminiKeyConfig {
  id: string;
  key: string;
  label?: string;
  createdAt: number;
  expiresAt: number;
  usageByModel: Record<GeminiModel, number>;
}

export interface GeminiState {
  keys: GeminiKeyConfig[];
  activeKeyId: string | null;
  selectedModel: GeminiModel;
  autoSwitch: boolean;
  lastResetAt?: number;
}
