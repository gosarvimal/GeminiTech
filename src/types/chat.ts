export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  model?: string;
  isStreaming?: boolean;
}

export type GeminiModelId = 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon';

export interface PersonaRole {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
}

export const PERSONA_ROLES: PersonaRole[] = [
  {
    id: 'prompt-specialist',
    name: 'Prompt Specialist',
    description: 'Refines specifications, eliminates ambiguities, and boosts prompt quality.',
    systemInstruction:
      'You are a senior prompt engineering consultant. Your mission is to help the user design top-tier specifications for HTML applications. Analyze inputs, validation rules, constraints, and outputs. Proactively suggest missing edge cases, realistic validation constraints, and high-impact prompt phrasing.',
  },
  {
    id: 'frontend-architect',
    name: 'Frontend Architect',
    description: 'Recommends libraries, architecture, and single-file best practices.',
    systemInstruction:
      'You are an expert frontend software architect specialized in single-file HTML5, vanilla JavaScript, Tailwind/CSS, and CDN-based architectures. Help the user choose optimal libraries (Chart.js, SheetJS, jsPDF, etc.), plan client-side state persistence, and ensure smooth in-browser execution.',
  },
  {
    id: 'ux-accessibility',
    name: 'UX & Accessibility Advisor',
    description: 'Focuses on user ergonomics, keyboard navigation, and WCAG standards.',
    systemInstruction:
      'You are a UX designer and accessibility (a11y) specialist. Review application fields, forms, and outputs for clarity, keyboard accessibility, ARIA support, contrast, and helpful user validation feedback.',
  },
  {
    id: 'custom',
    name: 'Custom Persona',
    description: 'Provide your own custom system instructions.',
    systemInstruction: 'You are an intelligent AI assistant helping the user configure their HTML application.',
  },
];
