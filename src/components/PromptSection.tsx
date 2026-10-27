import React from 'react';

interface PromptSectionProps {
  promptText: string;
  statusMessage: string;
  isStatusError: boolean;
  onPromptChange: (val: string) => void;
  onGenerate: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onReset: () => void;
}

export const PromptSection: React.FC<PromptSectionProps> = ({
  promptText,
  statusMessage,
  isStatusError,
  onPromptChange,
  onGenerate,
  onCopy,
  onDownload,
  onReset,
}) => {
  return (
    <section className="card full">
      <h2>Generate your prompt</h2>
      <p>
        Once all sections are complete, click <strong>Generate Prompt</strong>.
        Copy the result into ChatGPT, Google AI Studio, Claude or another AI coding
        assistant.
      </p>

      <div className="actions">
        <button id="generate" type="button" onClick={onGenerate}>
          Generate Prompt
        </button>
        <button id="copy" type="button" className="secondary" onClick={onCopy}>
          Copy Prompt
        </button>
        <button id="download" type="button" className="secondary" onClick={onDownload}>
          Download .txt
        </button>
        <button id="reset" type="button" className="danger" onClick={onReset}>
          Reset All
        </button>
      </div>

      <div
        id="status"
        className={`status ${isStatusError ? 'error-msg' : ''}`}
        role="status"
        aria-live="polite"
      >
        {statusMessage}
      </div>

      <label htmlFor="prompt">Generated prompt (editable)</label>
      <textarea
        id="prompt"
        placeholder="Your complete prompt will appear here..."
        spellCheck={false}
        value={promptText}
        onChange={(e) => onPromptChange(e.target.value)}
      />
    </section>
  );
};
