export interface ModelDefinition {
  id: string;
  name: string;
  description: string;
  limit: number;
}

export const GEMINI_MODELS: ModelDefinition[] = [
  {
    id: 'gemini-3.1-flash-lite-preview',
    name: 'Gemini 3.1 Flash Lite',
    description: 'Lightweight and agile for rapid iterations.',
    limit: 20
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    description: 'Fast and efficient for high-volume optimizations.',
    limit: 20
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast and efficient for high-volume optimizations.',
    limit: 20
  }
];

export const DEFAULT_MODEL = GEMINI_MODELS[0].id;
