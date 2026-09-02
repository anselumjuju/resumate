import { GeminiState, GeminiModel, GeminiKeyConfig } from '@/types/ai';
import { GEMINI_MODELS } from '@/constants/models';

export interface GeminiRequestConfig {
  key: string;
  model: GeminiModel;
  keyId: string;
}

export type GeminiSelectionResult =
  | { success: true; config: GeminiRequestConfig }
  | { success: false; error: string };

const ALL_MODELS = GEMINI_MODELS.map(m => m.id);

function isKeyValid(k: GeminiKeyConfig): boolean {
  if (!k.key) return false;
  return typeof k.expiresAt !== 'number' || Date.now() < k.expiresAt;
}

export function selectGeminiConfig(state: GeminiState): GeminiSelectionResult {
  const validKeys = (state.keys || []).filter(isKeyValid);

  if (validKeys.length === 0) {
    return { success: false, error: 'No active or non-expired Gemini API keys available. Please add an API key in Settings.' };
  }

  const { activeKeyId, selectedModel, autoSwitch } = state;

  // Find the starting key
  let startIndex = validKeys.findIndex(k => k.id === activeKeyId);
  if (startIndex === -1) startIndex = 0;

  if (!autoSwitch) {
    const activeKey = validKeys[startIndex];
    if (!activeKey) return { success: false, error: 'Active key not found or expired.' };

    return {
      success: true,
      config: {
        key: activeKey.key,
        model: selectedModel,
        keyId: activeKey.id,
      }
    };
  }

  // Auto-switch logic across non-expired keys
  for (let i = 0; i < validKeys.length; i++) {
    const currentIndex = (startIndex + i) % validKeys.length;
    const currentKey = validKeys[currentIndex];

    const modelOrder = [selectedModel, ...ALL_MODELS.filter(m => m !== selectedModel)];

    for (const model of modelOrder) {
      if ((currentKey.usageByModel[model] || 0) < 20) {
        return {
          success: true,
          config: {
            key: currentKey.key,
            model: model,
            keyId: currentKey.id,
          }
        };
      }
    }
  }

  return {
    success: false,
    error: 'All configured non-expired API keys and models have reached their usage limit (20 requests per model).'
  };
}
