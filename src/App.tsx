import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { GoalSection } from './components/GoalSection';
import { InputsSection } from './components/InputsSection';
import { OutputsSection } from './components/OutputsSection';
import { BehaviorSection } from './components/BehaviorSection';
import { LibrariesSection } from './components/LibrariesSection';
import { DesignSection } from './components/DesignSection';
import { DeliverablesSection } from './components/DeliverablesSection';
import { PromptSection } from './components/PromptSection';
import {
  AppState,
  InputFieldData,
  OutputFieldData,
  ReferenceFileRecord,
  ValidationErrors,
} from './types';
import {
  STORAGE_KEY,
  DEFAULT_STATE,
  createDefaultInput,
  createDefaultOutput,
} from './constants';
import { buildPrompt } from './promptGenerator';

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          inputs: Array.isArray(parsed.inputs) && parsed.inputs.length > 0
            ? parsed.inputs
            : DEFAULT_STATE.inputs,
          outputs: Array.isArray(parsed.outputs) && parsed.outputs.length > 0
            ? parsed.outputs
            : DEFAULT_STATE.outputs,
        };
      }
    } catch {
      // LocalStorage unavailable or parse error
    }
    return DEFAULT_STATE;
  });

  const [promptText, setPromptText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isStatusError, setIsStatusError] = useState<boolean>(false);
  const [fileStatuses, setFileStatuses] = useState<{ [index: number]: string }>({});
  const [errors, setErrors] = useState<ValidationErrors>({
    inputTitles: {},
    inputMin: {},
    inputStep: {},
    inputChoices: {},
    outputTitles: {},
    outputAiTasks: {},
  });

  const referenceFilesRef = useRef<Map<number, ReferenceFileRecord>>(new Map());

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      setStatusMessage('Browser storage is unavailable; this draft may not persist.');
    }
  }, [state]);

  const updateStateField = <K extends keyof AppState>(field: K, value: AppState[K]) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputCountChange = (countStr: string) => {
    const count = Math.max(1, Math.min(10, parseInt(countStr, 10) || 1));
    setState((prev) => {
      const current = [...prev.inputs];
      if (count > current.length) {
        const additional = Array.from({ length: count - current.length }, () =>
          createDefaultInput()
        );
        return { ...prev, inputCount: String(count), inputs: [...current, ...additional] };
      } else {
        return { ...prev, inputCount: String(count), inputs: current.slice(0, count) };
      }
    });
  };

  const handleInputChange = (
    index: number,
    field: keyof InputFieldData,
    value: string
  ) => {
    setState((prev) => {
      const newInputs = [...prev.inputs];
      newInputs[index] = { ...newInputs[index], [field]: value };
      return { ...prev, inputs: newInputs };
    });
    // Clear error for this field
    if (field === 'title') {
      setErrors((prev) => ({
        ...prev,
        inputTitles: { ...prev.inputTitles, [index]: false },
      }));
    }
  };

  const handleOutputCountChange = (countStr: string) => {
    const count = Math.max(1, Math.min(10, parseInt(countStr, 10) || 1));
    referenceFilesRef.current.clear();
    setFileStatuses({});
    setState((prev) => {
      const current = [...prev.outputs];
      if (count > current.length) {
        const additional = Array.from({ length: count - current.length }, () =>
          createDefaultOutput()
        );
        return { ...prev, outputCount: String(count), outputs: [...current, ...additional] };
      } else {
        return { ...prev, outputCount: String(count), outputs: current.slice(0, count) };
      }
    });
  };

  const handleOutputChange = (
    index: number,
    field: keyof OutputFieldData,
    value: any
  ) => {
    setState((prev) => {
      const newOutputs = [...prev.outputs];
      newOutputs[index] = { ...newOutputs[index], [field]: value };
      return { ...prev, outputs: newOutputs };
    });
    if (field === 'title') {
      setErrors((prev) => ({
        ...prev,
        outputTitles: { ...prev.outputTitles, [index]: false },
      }));
    }
    if (field === 'aiTask') {
      setErrors((prev) => ({
        ...prev,
        outputAiTasks: { ...prev.outputAiTasks, [index]: false },
      }));
    }
  };

  const handleFileUpload = (index: number, file: File | null) => {
    referenceFilesRef.current.delete(index);
    if (!file) {
      setFileStatuses((prev) => ({ ...prev, [index]: 'No sample selected' }));
      setState((prev) => {
        const newOutputs = [...prev.outputs];
        newOutputs[index] = { ...newOutputs[index], referenceName: '' };
        return { ...prev, outputs: newOutputs };
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileStatuses((prev) => ({
        ...prev,
        [index]: 'File too large (maximum 10 MB).',
      }));
      return;
    }

    if (
      !/\.(pdf|docx|xlsx|csv|txt|html|png|jpe?g|webp|json|md)$/i.test(file.name)
    ) {
      setFileStatuses((prev) => ({
        ...prev,
        [index]: 'Unsupported file type.',
      }));
      return;
    }

    const record: ReferenceFileRecord = {
      name: file.name,
      size: file.size,
      textContent: null,
    };
    referenceFilesRef.current.set(index, record);

    setFileStatuses((prev) => ({
      ...prev,
      [index]: 'Selected: ' + file.name,
    }));

    setState((prev) => {
      const newOutputs = [...prev.outputs];
      newOutputs[index] = { ...newOutputs[index], referenceName: file.name };
      return { ...prev, outputs: newOutputs };
    });

    if (/\.(txt|csv|json|md|html)$/i.test(file.name) && file.size <= 60000) {
      file
        .text()
        .then((t) => {
          if (referenceFilesRef.current.get(index) === record) {
            record.textContent = t;
            setFileStatuses((prev) => ({
              ...prev,
              [index]: 'Selected: ' + file.name + ' (text will be included in prompt)',
            }));
          }
        })
        .catch(() => {
          setFileStatuses((prev) => ({
            ...prev,
            [index]: 'Could not read sample; attach separately.',
          }));
        });
    }
  };

  // Color syncing
  const handlePrimaryColorChange = (color: string) => {
    setState((prev) => ({ ...prev, primaryColor: color, primaryHex: color }));
    setErrors((prev) => ({ ...prev, primaryHex: false }));
  };

  const handlePrimaryHexChange = (hex: string) => {
    const isValHex = /^#[0-9a-f]{6}$/i.test(hex);
    setState((prev) => ({
      ...prev,
      primaryHex: hex,
      primaryColor: isValHex ? hex : prev.primaryColor,
    }));
    if (isValHex) {
      setErrors((prev) => ({ ...prev, primaryHex: false }));
    }
  };

  const handleAccentColorChange = (color: string) => {
    setState((prev) => ({ ...prev, accentColor: color, accentHex: color }));
    setErrors((prev) => ({ ...prev, accentHex: false }));
  };

  const handleAccentHexChange = (hex: string) => {
    const isValHex = /^#[0-9a-f]{6}$/i.test(hex);
    setState((prev) => ({
      ...prev,
      accentHex: hex,
      accentColor: isValHex ? hex : prev.accentColor,
    }));
    if (isValHex) {
      setErrors((prev) => ({ ...prev, accentHex: false }));
    }
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {
      appName: false,
      goal: false,
      primaryHex: false,
      accentHex: false,
      inputTitles: {},
      inputMin: {},
      inputStep: {},
      inputChoices: {},
      outputTitles: {},
      outputAiTasks: {},
    };

    const errorList: string[] = [];

    if (!state.appName.trim()) {
      newErrors.appName = true;
      errorList.push('Application name');
    }
    if (!state.goal.trim()) {
      newErrors.goal = true;
      errorList.push('Goal');
    }

    state.inputs.forEach((input, i) => {
      if (!input.title.trim()) {
        newErrors.inputTitles[i] = true;
        errorList.push(`Field title ${i + 1}`);
      }

      if (['Number', 'Integer'].includes(input.type)) {
        if (
          input.min !== '' &&
          input.max !== '' &&
          Number(input.min) > Number(input.max)
        ) {
          newErrors.inputMin[i] = true;
          errorList.push(`Input ${i + 1}: minimum exceeds maximum`);
        }
        if (input.step !== '' && Number(input.step) <= 0) {
          newErrors.inputStep[i] = true;
          errorList.push(`Input ${i + 1}: increment must be positive`);
        }
      }

      if (['Dropdown', 'Radio buttons'].includes(input.type)) {
        if (!input.choices.trim()) {
          newErrors.inputChoices[i] = true;
          errorList.push(`Input ${i + 1}: provide at least one choice`);
        }
      }
    });

    state.outputs.forEach((output, i) => {
      if (!output.title.trim()) {
        newErrors.outputTitles[i] = true;
        errorList.push(`Output title ${i + 1}`);
      }
      if (output.ai && !output.aiTask.trim()) {
        newErrors.outputAiTasks[i] = true;
        errorList.push('AI task instructions');
      }
    });

    if (!/^#[0-9a-f]{6}$/i.test(state.primaryHex.trim())) {
      newErrors.primaryHex = true;
      errorList.push('primaryHex must be a six-digit HEX color');
    }

    if (!/^#[0-9a-f]{6}$/i.test(state.accentHex.trim())) {
      newErrors.accentHex = true;
      errorList.push('accentHex must be a six-digit HEX color');
    }

    setErrors(newErrors);

    if (errorList.length > 0) {
      setIsStatusError(true);
      setStatusMessage('Please complete or correct: ' + errorList.join(', '));
      setTimeout(() => {
        const firstErrorEl = document.querySelector('.error') as HTMLElement | null;
        firstErrorEl?.focus();
      }, 50);
      return false;
    }

    setIsStatusError(false);
    return true;
  }, [state]);

  const handleGenerate = () => {
    if (!validateForm()) return;
    const generated = buildPrompt(state, referenceFilesRef.current);
    setPromptText(generated);
    setIsStatusError(false);
    setStatusMessage('Prompt generated successfully. Review, copy, or download it.');
  };

  const handleCopy = async () => {
    let textToCopy = promptText;
    if (!textToCopy.trim()) {
      if (!validateForm()) return;
      textToCopy = buildPrompt(state, referenceFilesRef.current);
      setPromptText(textToCopy);
    }
    if (!textToCopy.trim()) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsStatusError(false);
      setStatusMessage('Copied to clipboard.');
    } catch {
      const textarea = document.getElementById('prompt') as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
      setIsStatusError(false);
      setStatusMessage('Clipboard unavailable. Prompt selected; press Ctrl+C to copy.');
    }
  };

  const handleDownload = () => {
    let textToDownload = promptText;
    if (!textToDownload.trim()) {
      if (!validateForm()) return;
      textToDownload = buildPrompt(state, referenceFilesRef.current);
      setPromptText(textToDownload);
    }
    if (!textToDownload.trim()) return;

    const url = URL.createObjectURL(
      new Blob([textToDownload], { type: 'text/plain;charset=utf-8' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HTML_Application_Prompt.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setIsStatusError(false);
    setStatusMessage('Prompt text file downloaded.');
  };

  const handleReset = () => {
    if (!window.confirm('Clear all fields and the saved draft?')) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    referenceFilesRef.current.clear();
    setFileStatuses({});
    setState(DEFAULT_STATE);
    setPromptText('');
    setIsStatusError(false);
    setStatusMessage('All fields have been reset.');
    setErrors({
      inputTitles: {},
      inputMin: {},
      inputStep: {},
      inputChoices: {},
      outputTitles: {},
      outputAiTasks: {},
    });
  };

  return (
    <main className="wrap">
      <Header />
      <div className="grid">
        <GoalSection
          appName={state.appName}
          goal={state.goal}
          audience={state.audience}
          hasAppNameError={Boolean(errors.appName)}
          hasGoalError={Boolean(errors.goal)}
          onChange={(f, val) => {
            updateStateField(f, val);
            if (f === 'appName') setErrors((e) => ({ ...e, appName: false }));
            if (f === 'goal') setErrors((e) => ({ ...e, goal: false }));
          }}
        />

        <InputsSection
          inputCount={state.inputCount}
          inputs={state.inputs}
          inputTitlesError={errors.inputTitles}
          inputMinError={errors.inputMin}
          inputStepError={errors.inputStep}
          inputChoicesError={errors.inputChoices}
          onCountChange={handleInputCountChange}
          onInputChange={handleInputChange}
        />

        <OutputsSection
          outputCount={state.outputCount}
          outputs={state.outputs}
          outputTitlesError={errors.outputTitles}
          outputAiTasksError={errors.outputAiTasks}
          fileStatuses={fileStatuses}
          onCountChange={handleOutputCountChange}
          onOutputChange={handleOutputChange}
          onFileUpload={handleFileUpload}
        />

        <BehaviorSection
          persist={state.persist}
          validate={state.validate}
          highlight={state.highlight}
          extraRules={state.extraRules}
          onCheckboxChange={(field, checked) => updateStateField(field, checked)}
          onExtraRulesChange={(val) => updateStateField('extraRules', val)}
        />

        <LibrariesSection
          libraries={state.libraries}
          libraryNames={state.libraryNames}
          onChange={(f, val) => updateStateField(f, val)}
        />

        <DesignSection
          primaryColor={state.primaryColor}
          primaryHex={state.primaryHex}
          accentColor={state.accentColor}
          accentHex={state.accentHex}
          style={state.style}
          font={state.font}
          mobile={state.mobile}
          hasPrimaryHexError={Boolean(errors.primaryHex)}
          hasAccentHexError={Boolean(errors.accentHex)}
          onPrimaryColorChange={handlePrimaryColorChange}
          onPrimaryHexChange={handlePrimaryHexChange}
          onAccentColorChange={handleAccentColorChange}
          onAccentHexChange={handleAccentHexChange}
          onStyleChange={(s) => updateStateField('style', s)}
          onFontChange={(f) => updateStateField('font', f)}
          onMobileChange={(m) => updateStateField('mobile', m)}
        />

        <DeliverablesSection
          single={state.single}
          embedded={state.embedded}
          doubleClick={state.doubleClick}
          comments={state.comments}
          sample={state.sample}
          tests={state.tests}
          onChange={(field, checked) => updateStateField(field, checked)}
        />

        <PromptSection
          promptText={promptText}
          statusMessage={statusMessage}
          isStatusError={isStatusError}
          onPromptChange={setPromptText}
          onGenerate={handleGenerate}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      </div>
    </main>
  );
};

export default App;
