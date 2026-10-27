import React from 'react';

interface DeliverablesSectionProps {
  single: boolean;
  embedded: boolean;
  doubleClick: boolean;
  comments: boolean;
  sample: boolean;
  tests: boolean;
  onChange: (
    field:
      | 'single'
      | 'embedded'
      | 'doubleClick'
      | 'comments'
      | 'sample'
      | 'tests',
    checked: boolean
  ) => void;
}

export const DeliverablesSection: React.FC<DeliverablesSectionProps> = ({
  single,
  embedded,
  doubleClick,
  comments,
  sample,
  tests,
  onChange,
}) => {
  return (
    <section className="card full">
      <h2>07 · Deliverables</h2>
      <div className="check">
        <input
          type="checkbox"
          id="single"
          checked={single}
          onChange={(e) => onChange('single', e.target.checked)}
        />
        <label htmlFor="single">One standalone .html file</label>
      </div>

      <div className="check">
        <input
          type="checkbox"
          id="embedded"
          checked={embedded}
          onChange={(e) => onChange('embedded', e.target.checked)}
        />
        <label htmlFor="embedded">
          All custom HTML, CSS and JavaScript embedded in that file
        </label>
      </div>

      <div className="check">
        <input
          type="checkbox"
          id="doubleClick"
          checked={doubleClick}
          onChange={(e) => onChange('doubleClick', e.target.checked)}
        />
        <label htmlFor="doubleClick">Ready to double-click and run in a browser</label>
      </div>

      <div className="check">
        <input
          type="checkbox"
          id="comments"
          checked={comments}
          onChange={(e) => onChange('comments', e.target.checked)}
        />
        <label htmlFor="comments">Comments explaining main functions</label>
      </div>

      <div className="check">
        <input
          type="checkbox"
          id="sample"
          checked={sample}
          onChange={(e) => onChange('sample', e.target.checked)}
        />
        <label htmlFor="sample">Include sample data and a clear demonstration</label>
      </div>

      <div className="check">
        <input
          type="checkbox"
          id="tests"
          checked={tests}
          onChange={(e) => onChange('tests', e.target.checked)}
        />
        <label htmlFor="tests">Include test cases and expected results</label>
      </div>
    </section>
  );
};
