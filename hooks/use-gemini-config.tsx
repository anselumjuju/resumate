'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { GeminiState, GeminiKeyConfig, GeminiModel } from '@/types/ai';
import { GEMINI_MODELS, DEFAULT_MODEL } from '@/constants/models';
import { clearAllResumateStorage } from '@/lib/storage';

const LOCAL_STORAGE_KEY = 'gemini_config';
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const DEFAULT_STATE: GeminiState = {
  keys: [],
  activeKeyId: null,
  selectedModel: DEFAULT_MODEL,
  autoSwitch: true,
  lastResetAt: Date.now(),
};

interface GeminiConfigContextType extends GeminiState {
  isLoaded: boolean;
  addKey: (key: string, label?: string) => void;
  removeKey: (id: string) => void;
  setActiveKey: (id: string) => void;
  setModel: (model: GeminiModel) => void;
  setAutoSwitch: (enabled: boolean) => void;
  incrementUsage: (keyId: string, model: GeminiModel) => void;
  clearAllData: () => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
}

const GeminiConfigContext = createContext<GeminiConfigContextType | undefined>(undefined);

function normalizeKey(k: any): GeminiKeyConfig {
  const createdAt = typeof k.createdAt === 'number' ? k.createdAt : Date.now();
  const expiresAt = typeof k.expiresAt === 'number' ? k.expiresAt : createdAt + THIRTY_DAYS_MS;

  return {
    id: k.id || crypto.randomUUID(),
    key: k.key || '',
    label: k.label || 'API Key',
    createdAt,
    expiresAt,
    usageByModel:
      k.usageByModel ||
      GEMINI_MODELS.reduce(
        (acc, m) => ({
          ...acc,
          [m.id]: 0,
        }),
        {} as Record<GeminiModel, number>,
      ),
  };
}

function isKeyExpired(key: GeminiKeyConfig): boolean {
  return typeof key.expiresAt === 'number' && Date.now() > key.expiresAt;
}

export function GeminiConfigProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GeminiState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Initial Hydration from localStorage
  useEffect(() => {
    let savedKeys: GeminiKeyConfig[] = [];
    let savedSettings: Partial<GeminiState> = {};

    try {
      const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed.keys)) {
          savedKeys = parsed.keys.map((item: any) => normalizeKey(item)).filter((k: GeminiKeyConfig) => !isKeyExpired(k));
        }
        savedSettings = {
          selectedModel: parsed.selectedModel || DEFAULT_MODEL,
          autoSwitch: parsed.autoSwitch !== undefined ? Boolean(parsed.autoSwitch) : true,
          lastResetAt: parsed.lastResetAt || Date.now(),
          activeKeyId: parsed.activeKeyId || null,
        };
      }
    } catch (e) {
      console.error('Failed to parse gemini config from localStorage', e);
    }

    const initialActiveId =
      savedSettings.activeKeyId && savedKeys.some((k) => k.id === savedSettings.activeKeyId)
        ? savedSettings.activeKeyId
        : savedKeys.length > 0
        ? savedKeys[0].id
        : null;

    setState({
      keys: savedKeys,
      activeKeyId: initialActiveId,
      selectedModel: savedSettings.selectedModel || DEFAULT_MODEL,
      autoSwitch: savedSettings.autoSwitch ?? true,
      lastResetAt: savedSettings.lastResetAt || Date.now(),
    });

    setIsLoaded(true);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (!isLoaded) return;

    try {
      const persistentKeys = state.keys.filter((k) => !isKeyExpired(k));

      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          keys: persistentKeys,
          selectedModel: state.selectedModel,
          autoSwitch: state.autoSwitch,
          lastResetAt: state.lastResetAt,
          activeKeyId: state.activeKeyId,
        }),
      );
    } catch (e) {
      console.error('Failed to persist gemini config', e);
    }
  }, [state, isLoaded]);

  // Periodic expiration cleanup (every 30s)
  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      setState((prev) => {
        const nonExpired = prev.keys.filter((k) => !isKeyExpired(k));
        if (nonExpired.length === prev.keys.length) return prev;

        const stillHasActive = nonExpired.some((k) => k.id === prev.activeKeyId);
        return {
          ...prev,
          keys: nonExpired,
          activeKeyId: stillHasActive ? prev.activeKeyId : nonExpired.length > 0 ? nonExpired[0].id : null,
        };
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoaded]);

  // Quota reset check (midnight UTC)
  useEffect(() => {
    if (!isLoaded) return;

    const checkReset = () => {
      const now = new Date();
      const lastReset = new Date(state.lastResetAt || Date.now());

      const isDifferentDay =
        now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
        now.getUTCMonth() !== lastReset.getUTCMonth() ||
        now.getUTCDate() !== lastReset.getUTCDate();

      if (isDifferentDay) {
        setState((prev) => ({
          ...prev,
          lastResetAt: Date.now(),
          keys: prev.keys.map((k) => ({
            ...k,
            usageByModel: GEMINI_MODELS.reduce(
              (acc, m) => ({
                ...acc,
                [m.id]: 0,
              }),
              {} as Record<GeminiModel, number>,
            ),
          })),
        }));
      }
    };

    checkReset();
    const interval = setInterval(checkReset, 60000);
    return () => clearInterval(interval);
  }, [isLoaded, state.lastResetAt]);

  const addKey = useCallback(
    (keyStr: string, label?: string) => {
      const now = Date.now();
      const newKeyConfig: GeminiKeyConfig = {
        id: crypto.randomUUID(),
        key: keyStr.trim(),
        label: label?.trim() || `Key ${state.keys.length + 1}`,
        createdAt: now,
        expiresAt: now + THIRTY_DAYS_MS,
        usageByModel: GEMINI_MODELS.reduce(
          (acc, m) => ({
            ...acc,
            [m.id]: 0,
          }),
          {} as Record<GeminiModel, number>,
        ),
      };

      setState((prev) => {
        const updatedKeys = [...prev.keys, newKeyConfig];
        return {
          ...prev,
          keys: updatedKeys,
          activeKeyId: prev.activeKeyId || newKeyConfig.id,
        };
      });
    },
    [state.keys.length],
  );

  const removeKey = useCallback((id: string) => {
    setState((prev) => {
      const updatedKeys = prev.keys.filter((k) => k.id !== id);
      const stillHasActive = updatedKeys.some((k) => k.id === prev.activeKeyId);
      return {
        ...prev,
        keys: updatedKeys,
        activeKeyId: stillHasActive ? prev.activeKeyId : updatedKeys.length > 0 ? updatedKeys[0].id : null,
      };
    });
  }, []);

  const setActiveKey = useCallback((id: string) => {
    setState((prev) => {
      if (prev.keys.some((k) => k.id === id)) {
        return { ...prev, activeKeyId: id };
      }
      return prev;
    });
  }, []);

  const setModel = useCallback((model: GeminiModel) => {
    setState((prev) => ({ ...prev, selectedModel: model }));
  }, []);

  const setAutoSwitch = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, autoSwitch: enabled }));
  }, []);

  const incrementUsage = useCallback((keyId: string, model: GeminiModel) => {
    setState((prev) => ({
      ...prev,
      keys: prev.keys.map((k) => {
        if (k.id !== keyId) return k;
        const currentCount = k.usageByModel[model] || 0;
        return {
          ...k,
          usageByModel: {
            ...k.usageByModel,
            [model]: currentCount + 1,
          },
        };
      }),
    }));
  }, []);

  const clearAllData = useCallback(() => {
    clearAllResumateStorage();
    setState(DEFAULT_STATE);
  }, []);

  return (
    <GeminiConfigContext.Provider
      value={{
        ...state,
        isLoaded,
        addKey,
        removeKey,
        setActiveKey,
        setModel,
        setAutoSwitch,
        incrementUsage,
        clearAllData,
        isDirty,
        setIsDirty,
      }}>
      {children}
    </GeminiConfigContext.Provider>
  );
}

export function useGeminiConfig() {
  const context = useContext(GeminiConfigContext);
  if (!context) {
    throw new Error('useGeminiConfig must be used within a GeminiConfigProvider');
  }
  return context;
}
