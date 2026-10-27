export interface InputFieldData {
  title: string;
  type: string;
  required: 'yes' | 'no';
  validation: string;
  choices: string;
  min: string;
  max: string;
  step: string;
  maxFile: string;
  detail: string;
}

export interface OutputFieldData {
  type: string;
  title: string;
  detail: string;
  ai: boolean;
  provider: string;
  aiTask: string;
  aiMode: string;
  referenceName?: string;
  referenceSize?: number;
  referenceContent?: string | null;
}

export interface AppState {
  appName: string;
  goal: string;
  audience: string;
  inputCount: string;
  outputCount: string;
  persist: boolean;
  validate: boolean;
  highlight: boolean;
  extraRules: string;
  libraries: string;
  libraryNames: string;
  primaryColor: string;
  primaryHex: string;
  accentColor: string;
  accentHex: string;
  style: string;
  font: string;
  mobile: boolean;
  single: boolean;
  embedded: boolean;
  doubleClick: boolean;
  comments: boolean;
  sample: boolean;
  tests: boolean;
  inputs: InputFieldData[];
  outputs: OutputFieldData[];
}

export interface ReferenceFileRecord {
  name: string;
  size: number;
  textContent: string | null;
}

export interface ValidationErrors {
  appName?: boolean;
  goal?: boolean;
  primaryHex?: boolean;
  accentHex?: boolean;
  inputTitles: { [index: number]: boolean };
  inputMin: { [index: number]: boolean };
  inputStep: { [index: number]: boolean };
  inputChoices: { [index: number]: boolean };
  outputTitles: { [index: number]: boolean };
  outputAiTasks: { [index: number]: boolean };
}
