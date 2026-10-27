import { AppState, ReferenceFileRecord } from './types';

export function buildPrompt(
  s: AppState,
  referenceFiles: Map<number, ReferenceFileRecord>
): string {
  const yes = (v: boolean) => (v ? 'Yes' : 'No');
  const lines: string[] = [
    `Act as a senior business analyst, UX designer, accessibility specialist, and expert frontend developer. Build a complete, working HTML application using the specification below.`,
    ``,
    `APPLICATION`,
    `Name: ${s.appName}`,
    `Goal: ${s.goal}`,
    `Target users: ${s.audience || 'General users'}`,
    ``,
    `INPUTS (${s.inputs.length})`,
  ];

  s.inputs.forEach((x, i) => {
    const rules: string[] = [];
    if (['Dropdown', 'Radio buttons'].includes(x.type)) {
      rules.push(
        'Exact choices: ' +
          x.choices
            .split(/\r?\n/)
            .map((v) => v.trim())
            .filter(Boolean)
            .join(' / ')
      );
    }
    if (['Number', 'Integer'].includes(x.type)) {
      if (x.min !== '') rules.push('Minimum: ' + x.min);
      if (x.max !== '') rules.push('Maximum: ' + x.max);
      if (x.step !== '') rules.push('Increment: ' + x.step);
      if (x.type === 'Integer') rules.push('Whole numbers only');
    }
    if (x.type.includes('upload') && x.maxFile) {
      rules.push('Max file size: ' + x.maxFile + ' MB');
    }
    if (x.detail) rules.push(x.detail);
    lines.push(
      `${i + 1}. ${x.title} | Type: ${x.type} | Required: ${yes(
        x.required === 'yes'
      )} | Validation: ${x.validation} | Options/constraints: ${
        rules.join('; ') || 'Apply sensible type-appropriate defaults'
      }`
    );
  });

  lines.push('', 'OUTPUTS');
  s.outputs.forEach((x, i) =>
    lines.push(
      `${i + 1}. ${x.title} | Format: ${x.type} | Requirements: ${
        x.detail || 'Provide a clear, usable output'
      } | AI needed: ${yes(x.ai)}${
        x.ai
          ? ' | Provider: ' +
            x.provider +
            ' | Task: ' +
            (x.aiTask || 'Generate relevant insights based on inputs') +
            ' | Integration: ' +
            x.aiMode
          : ''
      }`
    )
  );

  lines.push('', 'SAMPLE OUTPUT REFERENCES');
  s.outputs.forEach((x, i) => {
    const file = referenceFiles.get(i);
    const refName = file?.name || x.referenceName;
    lines.push(
      `Output ${i + 1} (${x.title}): ${
        file
          ? file.name + ' (' + file.size + ' bytes)'
          : refName
          ? refName + ' (must reselect after refresh)'
          : 'No reference uploaded'
      }`
    );
    if (
      file &&
      /\.(txt|csv|json|md|html)$/i.test(file.name) &&
      file.size <= 60000
    ) {
      lines.push(
        `Reference content for output ${i + 1}:`,
        file.textContent ||
          '[Reading sample — regenerate prompt after file finishes loading]'
      );
    } else if (file) {
      lines.push(
        'Binary sample: attach this exact file separately with the generated prompt; its contents are NOT embedded.'
      );
    }
  });

  lines.push(
    'Use each supplied reference to reproduce the relevant output structure, layout, headings, fields, and formatting as closely as technically feasible. Preserve required input-driven values. Never claim to have examined a binary sample unless it was actually attached to the AI conversation. Ask about ambiguous or missing template elements rather than inventing them.'
  );
  lines.push(
    '',
    'AI INTEGRATION REQUIREMENTS',
    '- For each AI-enabled output, invoke the selected provider only when requested; provide loading, retry, error, and fallback states.',
    '- Do not fabricate AI insights or claim that deterministic HTML templates are AI-generated.',
    '- A standalone local HTML file cannot securely embed private cloud API keys. For cloud providers, use a separately deployed secure backend proxy; clearly disclose that this means the solution is not truly single-file end-to-end.',
    '- For a strictly single-file demo, offer manual AI copy/paste or an explicitly user-configured local Ollama endpoint subject to CORS and local-server availability.',
    '- Never hardcode API secrets, store them in localStorage, or expose them in downloadable HTML.',
    '- Explain provider costs, network access, privacy and authentication requirements; request user consent before sending sensitive data.',
    '- If AI is essential and no secure integration is available, show an honest setup-required state rather than fake AI output.'
  );
  lines.push(
    '',
    'BEHAVIOR & VALIDATION',
    `- Save and restore entered data using browser localStorage: ${yes(
      s.persist
    )}. Do not persist uploaded file contents by default; explain that files must be reselected after refresh.`,
    `- Validate values by input type before processing: ${yes(s.validate)}.`,
    `- Highlight empty required fields and display field-specific error messages: ${yes(
      s.highlight
    )}.`,
    `- GSTIN fields: validate 15-character structure using a suitable pattern, uppercase normalization, and checksum if feasible; clearly state validation limitations.`,
    `- Numeric inputs: reject nonnumeric values and enforce specified min/max and integer rules.`,
    `- File uploads: enforce accepted MIME/extension, file-size limits, and clear invalid-file errors.`,
    `- Dropdown/radio inputs: use the exact options specified, and never silently invent business-critical choices.`,
    `- Handle malformed data, unexpected values, and empty results gracefully.`,
    `- Additional rules: ${s.extraRules || 'None'}`,
    '',
    'LIBRARIES',
    `- Policy: ${s.libraries}.`,
    `- Preferred libraries: ${s.libraryNames || 'Choose only if necessary and permitted'}.`,
    `- If using CDNs, provide exact URLs and explain that internet access is needed; ensure the application can be opened as a local HTML file.`,
    `- Do not claim offline operation when CDN dependencies are required.`,
    '',
    'VISUAL DESIGN',
    `- Style: ${s.style}.`,
    `- Primary color: ${s.primaryHex}. Accent color: ${s.accentHex}.`,
    `- Font: ${s.font}.`,
    `- Responsive/mobile-friendly: ${yes(s.mobile)}.`,
    `- Use accessible labels, keyboard-friendly controls, good contrast, clear status messages, and professional spacing.`,
    '',
    'DELIVERABLES',
    `- Single .html file: ${yes(s.single)}.`,
    `- Embed all custom HTML/CSS/JavaScript in the same file: ${yes(
      s.embedded
    )}.`,
    `- Double-click to run in a modern browser: ${yes(s.doubleClick)}.`,
    `- Explain main functions with code comments: ${yes(s.comments)}.`,
    `- Include sample data and demonstration: ${yes(s.sample)}.`,
    `- Include test cases with expected results: ${yes(s.tests)}.`,
    `- Provide complete executable code, not snippets or pseudocode.`,
    `- Explain how to save as .html and run locally, and identify any browser/file/CDN restrictions.`,
    `- Verify calculations, output generation, validation, and persistence against explicit test cases.`,
    `- Do not use a server, login, API key, or backend unless explicitly requested.`,
    `- If a requested output requires a library (e.g., XLSX or PDF), use an allowed client-side library and clearly describe dependency requirements.`,
    `- Do not silently replace real XLSX/PDF generation with renamed CSV/text files.`,
    '',
    `Return the full HTML source code followed by concise run instructions, test cases, and known limitations.`
  );

  return lines.join('\n');
}
