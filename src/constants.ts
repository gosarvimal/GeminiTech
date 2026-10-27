import { InputFieldData, OutputFieldData, AppState } from './types';

export const STORAGE_KEY = 'html-prompt-builder-v3';

export const INPUT_TYPES = [
  'Text',
  'Multiline text',
  'Number',
  'Integer',
  'Date',
  'Email',
  'Phone',
  'GSTIN',
  'Dropdown',
  'Checkbox',
  'Radio buttons',
  'PDF upload',
  'CSV upload',
  'Excel upload',
  'Text file upload',
  'Image upload',
  'Any file upload',
  'URL',
];

export const VALIDATION_PRESETS = [
  'Auto (based on input type)',
  'Required non-empty',
  'Email format',
  'Indian mobile (10 digits)',
  'GSTIN format + checksum',
  'PAN format',
  'PIN code (India, 6 digits)',
  'IFSC code',
  'Aadhaar format (12 digits; format only)',
  'URL format',
  'Only letters',
  'Alphanumeric',
  'Integer only',
  'Positive number',
  'Non-negative number',
  'Decimal number',
  'Numeric range',
  'Minimum / maximum length',
  'Date not in past',
  'Date not in future',
  'Date range',
  'File extension / MIME',
  'Maximum file size',
  'Dropdown selection only',
  'Custom regex',
];

export const AI_PROVIDERS = [
  'OpenAI API',
  'Google Gemini API',
  'Anthropic Claude API',
  'Microsoft Azure OpenAI',
  'OpenRouter (compatible API)',
  'Ollama (local)',
  'Custom REST AI endpoint',
];

export const AI_MODES = [
  'Secure backend proxy (recommended)',
  'Local Ollama server',
  'User-provided API key in session (demo only)',
  'Manual copy/paste AI fallback',
];

export const OUTPUT_TYPES = [
  'On-screen table',
  'Invoice',
  'Download CSV',
  'Download Excel (.xlsx)',
  'Download PDF',
  'On-screen report',
  'Downloadable report',
  'Interactive dashboard',
  'Printable document',
  'Chart / visualization',
  'Summary / KPI cards',
  'JSON download',
  'Plain text result',
  'Custom output',
];

export const STYLES = [
  'Modern corporate',
  'Minimalist',
  'Dashboard / analytics',
  'Glassmorphism',
  'Material-inspired',
  'Classic professional',
  'Dark mode',
  'Playful / educational',
];

export const FONTS = [
  'Segoe UI',
  'Arial',
  'Inter (with system fallback)',
  'Roboto (with system fallback)',
  'Georgia',
  'Verdana',
  'System UI',
];

export const LIBRARIES_OPTIONS = [
  { value: 'allowed', label: 'Allowed through CDN (optional)' },
  { value: 'none', label: 'No external libraries (fully offline)' },
  { value: 'required', label: 'Use selected CDN libraries when needed' },
];

export const createDefaultInput = (): InputFieldData => ({
  title: '',
  type: 'Text',
  required: 'yes',
  validation: VALIDATION_PRESETS[0],
  choices: '',
  min: '',
  max: '',
  step: '',
  maxFile: '',
  detail: '',
});

export const createDefaultOutput = (): OutputFieldData => ({
  type: OUTPUT_TYPES[0],
  title: '',
  detail: '',
  ai: false,
  provider: AI_PROVIDERS[0],
  aiTask: '',
  aiMode: 'Secure backend proxy (recommended)',
  referenceName: '',
});

export const DEFAULT_STATE: AppState = {
  appName: '',
  goal: '',
  audience: '',
  inputCount: '3',
  outputCount: '2',
  persist: true,
  validate: true,
  highlight: true,
  extraRules: '',
  libraries: 'allowed',
  libraryNames: '',
  primaryColor: '#2563eb',
  primaryHex: '#2563eb',
  accentColor: '#10b981',
  accentHex: '#10b981',
  style: 'Modern corporate',
  font: 'Segoe UI',
  mobile: true,
  single: true,
  embedded: true,
  doubleClick: true,
  comments: true,
  sample: true,
  tests: true,
  inputs: [createDefaultInput(), createDefaultInput(), createDefaultInput()],
  outputs: [createDefaultOutput(), createDefaultOutput()],
};
