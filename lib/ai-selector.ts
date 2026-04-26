import { GeminiState, GeminiModel } from '@/types/ai';

export interface GeminiRequestConfig {
  key: string;
  model: GeminiModel;
  keyId: string;
}

export type GeminiSelectionResult =
  | { success: true; config: GeminiRequestConfig }
  | { success: false; error: string };

const ALL_MODELS: GeminiModel[] = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'];

export function selectGeminiConfig(state: GeminiState): GeminiSelectionResult {
  const { keys, activeKeyId, selectedModel, autoSwitch } = state;

  if (keys.length === 0) {
    return { success: false, error: 'No Gemini API keys configured.' };
  }

  // Find the starting key
  let startIndex = keys.findIndex(k => k.id === activeKeyId);
  if (startIndex === -1) startIndex = 0;

  if (!autoSwitch) {
    const activeKey = keys[startIndex];
    if (!activeKey) return { success: false, error: 'Active key not found.' };

    return {
      success: true,
      config: {
        key: activeKey.key,
        model: selectedModel,
        keyId: activeKey.id,
      }
    };
  }

  // Auto-switch logic
  // "Try current key + model. If usageCount >= 20: Try same key with different model. If all models exhausted: Switch to next key."

  // We'll iterate through keys starting from startIndex
  for (let i = 0; i < keys.length; i++) {
    const currentIndex = (startIndex + i) % keys.length;
    const currentKey = keys[currentIndex];

    // For the current key, we try models
    // We prioritize the selectedModel if it's the first key
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
    error: 'All configured API keys and models have reached the usage limit (20 requests per model).'
  };
}
