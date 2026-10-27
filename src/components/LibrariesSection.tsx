import React from 'react';
import { LIBRARIES_OPTIONS } from '../constants';

interface LibrariesSectionProps {
  libraries: string;
  libraryNames: string;
  onChange: (field: 'libraries' | 'libraryNames', value: string) => void;
}

export const LibrariesSection: React.FC<LibrariesSectionProps> = ({
  libraries,
  libraryNames,
  onChange,
}) => {
  return (
    <section className="card">
      <h2>05 · Libraries</h2>
      <label htmlFor="libraries">External libraries</label>
      <select
        id="libraries"
        value={libraries}
        onChange={(e) => onChange('libraries', e.target.value)}
      >
        {LIBRARIES_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <label htmlFor="libraryNames">Preferred libraries (optional)</label>
      <input
        id="libraryNames"
        placeholder="e.g., SheetJS, Chart.js, jsPDF"
        value={libraryNames}
        onChange={(e) => onChange('libraryNames', e.target.value)}
      />

      <p className="hint">
        CDN libraries need internet access when first loaded. Offline use requires
        no dependencies or bundled code.
      </p>
    </section>
  );
};
