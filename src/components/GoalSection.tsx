import React from 'react';

interface GoalSectionProps {
  appName: string;
  goal: string;
  audience: string;
  hasAppNameError: boolean;
  hasGoalError: boolean;
  onChange: (field: 'appName' | 'goal' | 'audience', value: string) => void;
}

export const GoalSection: React.FC<GoalSectionProps> = ({
  appName,
  goal,
  audience,
  hasAppNameError,
  hasGoalError,
  onChange,
}) => {
  return (
    <section className="card">
      <h2>01 · Goal</h2>
      <label htmlFor="appName">Application name *</label>
      <input
        id="appName"
        className={hasAppNameError ? 'error' : ''}
        placeholder="e.g., GST Invoice Generator"
        value={appName}
        onChange={(e) => onChange('appName', e.target.value)}
        required
      />

      <label htmlFor="goal">What should it do, and why? *</label>
      <textarea
        id="goal"
        className={hasGoalError ? 'error' : ''}
        placeholder="In one or two sentences, describe the business problem and purpose."
        value={goal}
        onChange={(e) => onChange('goal', e.target.value)}
        required
      />

      <label htmlFor="audience">Intended users</label>
      <input
        id="audience"
        placeholder="e.g., Accounts teams, business owners"
        value={audience}
        onChange={(e) => onChange('audience', e.target.value)}
      />
    </section>
  );
};
