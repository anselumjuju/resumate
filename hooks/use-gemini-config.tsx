'use client';

import {createContext, useContext, useState, useEffect, useCallback, ReactNode} from 'react';
import {GeminiState, GeminiKeyConfig, GeminiModel} from '@/types/ai';

const STORAGE_KEY = 'gemini_config';

const DEFAULT_STATE: GeminiState = {
  keys: [],
  activeKeyId: null,
  selectedModel: 'gemini-2.5-flash',
  autoSwitch: false,
};

interface GeminiConfigContextType extends GeminiState {
  isLoaded: boolean;
  addKey: (key: string, label?: string) => void;
  removeKey: (id: string) => void;
  setActiveKey: (id: string) => void;
  setModel: (model: GeminiModel) => void;
  setAutoSwitch: (enabled: boolean) => void;
  incrementUsage: (keyId: string, model: GeminiModel) => void;
}

const GeminiConfigContext = createContext<GeminiConfigContextType | undefined>(undefined);

export function GeminiConfigProvider({children}: {children: ReactNode}) {
  const [state, setState] = useState<GeminiState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse gemini config', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const addKey = useCallback((key: string, label?: string) => {
    setState((prev) => {
      const newKey: GeminiKeyConfig = {
        id: crypto.randomUUID(),
        key,
        usageByModel: {
          'gemini-2.5-flash': 0,
          'gemini-2.5-pro': 0,
          'gemini-2.5-flash-lite': 0,
        },
        label: label || `Key ${prev.keys.length + 1}`,
      };
      return {
        ...prev,
        keys: [...prev.keys, newKey],
        activeKeyId: prev.activeKeyId || newKey.id,
      };
    });
  }, []);

  const removeKey = useCallback((id: string) => {
    setState((prev) => {
      const newKeys = prev.keys.filter((k) => k.id !== id);
      return {
        ...prev,
        keys: newKeys,
        activeKeyId: prev.activeKeyId === id ? newKeys[0]?.id || null : prev.activeKeyId,
      };
    });
  }, []);

  const setActiveKey = useCallback((id: string) => {
    setState((prev) => ({...prev, activeKeyId: id}));
  }, []);

  const setModel = useCallback((model: GeminiModel) => {
    setState((prev) => ({...prev, selectedModel: model}));
  }, []);

  const setAutoSwitch = useCallback((enabled: boolean) => {
    setState((prev) => ({...prev, autoSwitch: enabled}));
  }, []);

  const incrementUsage = useCallback((keyId: string, model: GeminiModel) => {
    setState((prev) => ({
      ...prev,
      keys: prev.keys.map((k) =>
        k.id === keyId ?
          {
            ...k,
            usageByModel: {
              ...k.usageByModel,
              [model]: (k.usageByModel[model] || 0) + 1,
            },
          }
        : k,
      ),
    }));
  }, []);

  return (
    <GeminiConfigContext.Provider value={{...state, isLoaded, addKey, removeKey, setActiveKey, setModel, setAutoSwitch, incrementUsage}}>{children}</GeminiConfigContext.Provider>
  );
}

export function useGeminiConfig() {
  const context = useContext(GeminiConfigContext);
  if (context === undefined) {
    throw new Error('useGeminiConfig must be used within a GeminiConfigProvider');
  }
  return context;
}
