import React from 'react';

interface BehaviorSectionProps {
  persist: boolean;
  validate: boolean;
  highlight: boolean;
  extraRules: string;
  onCheckboxChange: (field: 'persist' | 'validate' | 'highlight', checked: boolean) => void;
  onExtraRulesChange: (val: string) => void;
}

export const BehaviorSection: React.FC<BehaviorSectionProps> = ({
  persist,
  validate,
  highlight,
  extraRules,
  onCheckboxChange,
  onExtraRulesChange,
}) => {
  return (
    <section className="card">
      <h2>04 · Behavior & validation</h2>
      <div className="check">
        <input
          id="persist"
          type="checkbox"
          checked={persist}
          onChange={(e) => onCheckboxChange('persist', e.target.checked)}
        />
        <label htmlFor="persist">
          Save entered data in localStorage across refreshes
        </label>
      </div>

      <div className="check">
        <input
          id="validate"
          type="checkbox"
          checked={validate}
          onChange={(e) => onCheckboxChange('validate', e.target.checked)}
        />
        <label htmlFor="validate">
          Validate each input by type before submission
        </label>
      </div>

      <div className="check">
        <input
          id="highlight"
          type="checkbox"
          checked={highlight}
          onChange={(e) => onCheckboxChange('highlight', e.target.checked)}
        />
        <label htmlFor="highlight">
          Highlight empty mandatory fields and show clear errors
        </label>
      </div>

      <label htmlFor="extraRules">Additional behavior rules</label>
      <textarea
        id="extraRules"
        placeholder="e.g., Show live totals, prevent duplicate invoices"
        value={extraRules}
        onChange={(e) => onExtraRulesChange(e.target.value)}
      />
    </section>
  );
};
