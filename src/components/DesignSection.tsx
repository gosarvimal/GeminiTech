import React from 'react';
import { STYLES, FONTS } from '../constants';

interface DesignSectionProps {
  primaryColor: string;
  primaryHex: string;
  accentColor: string;
  accentHex: string;
  style: string;
  font: string;
  mobile: boolean;
  hasPrimaryHexError: boolean;
  hasAccentHexError: boolean;
  onPrimaryColorChange: (color: string) => void;
  onPrimaryHexChange: (hex: string) => void;
  onAccentColorChange: (color: string) => void;
  onAccentHexChange: (hex: string) => void;
  onStyleChange: (style: string) => void;
  onFontChange: (font: string) => void;
  onMobileChange: (mobile: boolean) => void;
}

export const DesignSection: React.FC<DesignSectionProps> = ({
  primaryColor,
  primaryHex,
  accentColor,
  accentHex,
  style,
  font,
  mobile,
  hasPrimaryHexError,
  hasAccentHexError,
  onPrimaryColorChange,
  onPrimaryHexChange,
  onAccentColorChange,
  onAccentHexChange,
  onStyleChange,
  onFontChange,
  onMobileChange,
}) => {
  return (
    <section className="card">
      <h2>06 · Design</h2>
      <div className="grid">
        <div>
          <label htmlFor="primaryColor">Primary color</label>
          <input
            type="color"
            id="primaryColor"
            value={primaryColor}
            onChange={(e) => onPrimaryColorChange(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="primaryHex">Primary HEX</label>
          <input
            id="primaryHex"
            className={hasPrimaryHexError ? 'error' : ''}
            value={primaryHex}
            maxLength={7}
            onChange={(e) => onPrimaryHexChange(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="accentColor">Accent color</label>
          <input
            type="color"
            id="accentColor"
            value={accentColor}
            onChange={(e) => onAccentColorChange(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="accentHex">Accent HEX</label>
          <input
            id="accentHex"
            className={hasAccentHexError ? 'error' : ''}
            value={accentHex}
            maxLength={7}
            onChange={(e) => onAccentHexChange(e.target.value)}
          />
        </div>
      </div>

      <label htmlFor="style">Visual style</label>
      <select
        id="style"
        value={style}
        onChange={(e) => onStyleChange(e.target.value)}
      >
        {STYLES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <label htmlFor="font">Font</label>
      <select
        id="font"
        value={font}
        onChange={(e) => onFontChange(e.target.value)}
      >
        {FONTS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      <div className="check">
        <input
          type="checkbox"
          id="mobile"
          checked={mobile}
          onChange={(e) => onMobileChange(e.target.checked)}
        />
        <label htmlFor="mobile">Mobile-friendly / responsive</label>
      </div>
    </section>
  );
};
