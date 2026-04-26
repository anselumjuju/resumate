'use client';

import {createContext, useContext, useState, useEffect, useCallback, ReactNode} from 'react';
import {GeminiState, GeminiKeyConfig, GeminiModel} from '@/types/ai';

const STORAGE_KEY = 'gemini_config';

const DEFAULT_STATE: GeminiState = {
  keys: [],
  activeKeyId: null,
  selectedModel: 'gemini-2.5-flash',
  autoSwitch: false,
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
}

const GeminiConfigContext = createContext<GeminiConfigContextType | undefined>(undefined);

export function GeminiConfigProvider({children}: {children: ReactNode}) {
  const [state, setState] = useState<GeminiState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed);
      } catch (e) {
        console.error('Failed to parse gemini config', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  // Daily Reset Logic (1 PM IST = 07:30 UTC)
  useEffect(() => {
    if (!isLoaded) return;

    const checkReset = () => {
      const now = new Date();
      const lastReset = state.lastResetAt ? new Date(state.lastResetAt) : new Date(0);
      
      const resetTimeToday = new Date(now);
      resetTimeToday.setUTCHours(7, 30, 0, 0);

      // If we are past today's 1 PM IST and last reset was before today's 1 PM IST
      if (now.getTime() >= resetTimeToday.getTime() && lastReset.getTime() < resetTimeToday.getTime()) {
        setState(prev => ({
          ...prev,
          lastResetAt: Date.now(),
          keys: prev.keys.map(k => ({
            ...k,
            usageByModel: {
              'gemini-2.5-flash': 0,
              'gemini-2.5-pro': 0,
              'gemini-2.5-flash-lite': 0,
            }
          }))
        }));
      }
    };

    checkReset();
    const interval = setInterval(checkReset, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isLoaded, state.lastResetAt]);

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
    setState((prev) => {
      const updatedKeys = prev.keys.map((k) =>
        k.id === keyId ?
          {
            ...k,
            usageByModel: {
              ...k.usageByModel,
              [model]: (k.usageByModel[model] || 0) + 1,
            },
          }
        : k,
      );

      const activeKey = updatedKeys.find(k => k.id === keyId);
      let nextModel = prev.selectedModel;

      // Auto-switch logic
      if (prev.autoSwitch && activeKey && activeKey.usageByModel[model] >= 20) {
        const models: GeminiModel[] = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'];
        const currentIndex = models.indexOf(model);
        
        // Find next available model that hasn't hit the limit
        for (let i = 1; i < models.length; i++) {
          const m = models[(currentIndex + i) % models.length];
          if (activeKey.usageByModel[m] < 20) {
            nextModel = m;
            break;
          }
        }
      }

      return {
        ...prev,
        keys: updatedKeys,
        selectedModel: nextModel
      };
    });
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
