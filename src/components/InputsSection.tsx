import React from 'react';
import { InputFieldData } from '../types';
import { INPUT_TYPES, VALIDATION_PRESETS } from '../constants';

interface InputsSectionProps {
  inputCount: string;
  inputs: InputFieldData[];
  inputTitlesError: { [index: number]: boolean };
  inputMinError: { [index: number]: boolean };
  inputStepError: { [index: number]: boolean };
  inputChoicesError: { [index: number]: boolean };
  onCountChange: (count: string) => void;
  onInputChange: (index: number, field: keyof InputFieldData, value: string) => void;
}

export const InputsSection: React.FC<InputsSectionProps> = ({
  inputCount,
  inputs,
  inputTitlesError,
  inputMinError,
  inputStepError,
  inputChoicesError,
  onCountChange,
  onInputChange,
}) => {
  return (
    <section className="card">
      <h2>02 · Inputs</h2>
      <label htmlFor="inputCount">Number of input fields (1–10)</label>
      <select
        id="inputCount"
        value={inputCount}
        onChange={(e) => onCountChange(e.target.value)}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={String(n)}>
            {n}
          </option>
        ))}
      </select>

      <div id="inputFields">
        {inputs.map((field, i) => {
          const isDropdownOrRadio = ['Dropdown', 'Radio buttons'].includes(field.type);
          const isNumeric = ['Number', 'Integer'].includes(field.type);
          const isUpload = field.type.includes('upload');

          return (
            <div key={i} className="dynamic" data-index={i}>
              <h3>Input {i + 1}</h3>
              <div className="three">
                <div>
                  <label>Field title *</label>
                  <input
                    className={`field-title ${inputTitlesError[i] ? 'error' : ''}`}
                    placeholder="e.g., GSTIN"
                    value={field.title}
                    onChange={(e) => onInputChange(i, 'title', e.target.value)}
                  />
                </div>
                <div>
                  <label>Input type</label>
                  <select
                    className="field-type"
                    value={field.type}
                    onChange={(e) => onInputChange(i, 'type', e.target.value)}
                  >
                    {INPUT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Mandatory?</label>
                  <select
                    className="field-required"
                    value={field.required}
                    onChange={(e) =>
                      onInputChange(i, 'required', e.target.value as 'yes' | 'no')
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              <label>Validation rule (select preset)</label>
              <select
                className="field-validation"
                value={field.validation}
                onChange={(e) => onInputChange(i, 'validation', e.target.value)}
              >
                {VALIDATION_PRESETS.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>

              <div className="constraint-panel">
                <label>Configure options and limits (no syntax required)</label>

                {isDropdownOrRadio && (
                  <div className="constraint-options" style={{ display: 'block' }}>
                    <label>Choices (one per line)</label>
                    <textarea
                      className={`field-choices ${
                        inputChoicesError[i] ? 'error' : ''
                      }`}
                      placeholder={`Basic\nIntermediate\nAdvance`}
                      value={field.choices}
                      onChange={(e) => onInputChange(i, 'choices', e.target.value)}
                    />
                  </div>
                )}

                {isNumeric && (
                  <div className="constraint-numeric" style={{ display: 'block' }}>
                    <div className="three">
                      <div>
                        <label>Minimum</label>
                        <input
                          type="number"
                          className={`field-min ${inputMinError[i] ? 'error' : ''}`}
                          placeholder="Optional"
                          value={field.min}
                          onChange={(e) => onInputChange(i, 'min', e.target.value)}
                        />
                      </div>
                      <div>
                        <label>Maximum</label>
                        <input
                          type="number"
                          className="field-max"
                          placeholder="Optional"
                          value={field.max}
                          onChange={(e) => onInputChange(i, 'max', e.target.value)}
                        />
                      </div>
                      <div>
                        <label>Increment</label>
                        <input
                          type="number"
                          min="0.000001"
                          step="any"
                          className={`field-step ${inputStepError[i] ? 'error' : ''}`}
                          placeholder="1"
                          value={field.step}
                          onChange={(e) => onInputChange(i, 'step', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isUpload && (
                  <div className="constraint-file" style={{ display: 'block' }}>
                    <label>Maximum file size (MB)</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      className="field-maxfile"
                      placeholder="5"
                      value={field.maxFile}
                      onChange={(e) => onInputChange(i, 'maxFile', e.target.value)}
                    />
                  </div>
                )}

                <label>Other requirements (optional)</label>
                <input
                  className="field-detail"
                  placeholder="Any additional business-specific rule"
                  value={field.detail}
                  onChange={(e) => onInputChange(i, 'detail', e.target.value)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
