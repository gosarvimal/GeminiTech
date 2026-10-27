import React from 'react';
import { OutputFieldData } from '../types';
import { OUTPUT_TYPES, AI_PROVIDERS, AI_MODES } from '../constants';

interface OutputsSectionProps {
  outputCount: string;
  outputs: OutputFieldData[];
  outputTitlesError: { [index: number]: boolean };
  outputAiTasksError: { [index: number]: boolean };
  fileStatuses: { [index: number]: string };
  onCountChange: (count: string) => void;
  onOutputChange: (index: number, field: keyof OutputFieldData, value: any) => void;
  onFileUpload: (index: number, file: File | null) => void;
}

export const OutputsSection: React.FC<OutputsSectionProps> = ({
  outputCount,
  outputs,
  outputTitlesError,
  outputAiTasksError,
  fileStatuses,
  onCountChange,
  onOutputChange,
  onFileUpload,
}) => {
  return (
    <section className="card">
      <h2>03 · Outputs</h2>
      <label htmlFor="outputCount">Number of outputs (1–10)</label>
      <select
        id="outputCount"
        value={outputCount}
        onChange={(e) => onCountChange(e.target.value)}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={String(n)}>
            {n}
          </option>
        ))}
      </select>

      <div id="outputFields">
        {outputs.map((field, i) => {
          return (
            <div key={i} className="dynamic">
              <h3>Output {i + 1}</h3>
              <div className="grid">
                <div>
                  <label>Output type</label>
                  <select
                    className="out-type"
                    value={field.type}
                    onChange={(e) => onOutputChange(i, 'type', e.target.value)}
                  >
                    {OUTPUT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Title / description *</label>
                  <input
                    className={`out-title ${outputTitlesError[i] ? 'error' : ''}`}
                    placeholder="e.g., Monthly sales summary"
                    value={field.title}
                    onChange={(e) => onOutputChange(i, 'title', e.target.value)}
                  />
                </div>
              </div>

              <div className="check" style={{ marginTop: '12px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  id={`out-ai-${i}`}
                  className="out-ai"
                  checked={field.ai}
                  onChange={(e) => onOutputChange(i, 'ai', e.target.checked)}
                />
                <label htmlFor={`out-ai-${i}`}>
                  Require AI-generated insights / content for this output
                </label>
              </div>

              {field.ai && (
                <div
                  className="ai-config"
                  style={{
                    display: 'block',
                    padding: '12px',
                    border: '1px solid #455773',
                    borderRadius: '10px',
                    margin: '8px 0',
                  }}
                >
                  <label>AI provider</label>
                  <select
                    className="out-provider"
                    value={field.provider}
                    onChange={(e) => onOutputChange(i, 'provider', e.target.value)}
                  >
                    {AI_PROVIDERS.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>

                  <label>AI task / instructions</label>
                  <input
                    className={`out-ai-task ${outputAiTasksError[i] ? 'error' : ''}`}
                    placeholder="e.g., Draft a persuasive training proposal using provided inputs"
                    value={field.aiTask}
                    onChange={(e) => onOutputChange(i, 'aiTask', e.target.value)}
                  />

                  <label>Integration mode</label>
                  <select
                    className="out-ai-mode"
                    value={field.aiMode}
                    onChange={(e) => onOutputChange(i, 'aiMode', e.target.value)}
                  >
                    {AI_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label>Sample output file (optional, one per output)</label>
              <input
                type="file"
                className="out-reference"
                accept=".pdf,.docx,.xlsx,.csv,.txt,.html,.png,.jpg,.jpeg,.webp,.json,.md"
                aria-label="Sample output reference file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  onFileUpload(i, file);
                }}
              />

              <div className="file-status" aria-live="polite">
                {fileStatuses[i] ||
                  (field.referenceName
                    ? `Previously selected: ${field.referenceName} — reselect after refresh`
                    : 'No sample selected')}
              </div>

              <p className="reference-note">
                Maximum 10 MB. PDF, Word, Excel and images are recorded as references;
                attach them separately when submitting the prompt to an AI.
                Text-based samples up to 60 KB can be embedded in the prompt.
              </p>

              <label>Specific requirements (optional)</label>
              <input
                className="out-detail"
                placeholder="e.g., Group by month, include grand total"
                value={field.detail}
                onChange={(e) => onOutputChange(i, 'detail', e.target.value)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};
