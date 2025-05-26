/**
 * Spelling Master Design System
 *
 * This file documents the design tokens, components, and patterns used throughout the application.
 * It serves as a reference for maintaining a consistent design language.
 */

import React from "react";
import {
  PrimaryButton,
  SecondaryButton,
  SuccessButton,
  OutlineButton,
} from "../components/UIComponents";
import FormField from "../components/FormField";

// Color Palette
export const colors = {
  // Primary Colors
  primary: {
    50: "#ebf5ff",
    100: "#e1effe",
    200: "#c3ddfd",
    300: "#a4cafe",
    400: "#76a9fa",
    500: "#3f83f8",
    600: "#1c64f2",
    700: "#1a56db",
    800: "#1e429f",
    900: "#233876",
    950: "#172554",
  },

  // Secondary / Gray Colors
  secondary: {
    50: "#f5f7fa",
    100: "#e4e7eb",
    200: "#cbd2d9",
    300: "#9aa5b1",
    400: "#7b8794",
    500: "#616e7c",
    600: "#52606d",
    700: "#3e4c59",
    800: "#323f4b",
    900: "#1f2933",
    950: "#0f172a",
  },

  // Semantic Colors
  success: {
    50: "#ecfdf5",
    500: "#10b981",
    600: "#059669",
  },
  warning: {
    50: "#fffbeb",
    500: "#f59e0b",
    600: "#d97706",
  },
  error: {
    50: "#fef2f2",
    500: "#ef4444",
    600: "#dc2626",
  },
};

// Typography Scale
export const typography = {
  h1: "text-3xl font-bold text-secondary-900 dark:text-secondary-50",
  h2: "text-2xl font-semibold text-secondary-900 dark:text-secondary-50",
  h3: "text-xl font-semibold text-secondary-800 dark:text-secondary-100",
  h4: "text-lg font-medium text-secondary-800 dark:text-secondary-100",
  bodyLarge: "text-base text-secondary-700 dark:text-secondary-200",
  bodyNormal: "text-sm text-secondary-700 dark:text-secondary-200",
  bodySmall: "text-xs text-secondary-600 dark:text-secondary-300",
};

// Spacing
export const spacing = {
  xs: "p-1",
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
};

// Component usage examples
export const DesignSystemReference: React.FC = () => {
  return (
    <div className="space-y-8">
      <section>
        <h2 className={typography.h2}>Typography</h2>
        <div className="mt-4 space-y-2">
          <h1 className={typography.h1}>Heading 1</h1>
          <h2 className={typography.h2}>Heading 2</h2>
          <h3 className={typography.h3}>Heading 3</h3>
          <h4 className={typography.h4}>Heading 4</h4>
          <p className={typography.bodyLarge}>Body Large</p>
          <p className={typography.bodyNormal}>Body Normal</p>
          <p className={typography.bodySmall}>Body Small</p>
        </div>
      </section>

      <section>
        <h2 className={typography.h2}>Buttons</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <PrimaryButton onClick={() => {}}>Primary Button</PrimaryButton>
          <SecondaryButton onClick={() => {}}>Secondary Button</SecondaryButton>
          <SuccessButton onClick={() => {}}>Success Button</SuccessButton>
          <OutlineButton onClick={() => {}}>Outline Button</OutlineButton>
        </div>
      </section>

      <section>
        <h2 className={typography.h2}>Form Fields</h2>
        <div className="mt-4 max-w-md">
          <FormField
            id="example-field"
            label="Example Field"
            placeholder="Enter text here"
            value=""
            onChange={() => {}}
          />
          <FormField
            id="example-error"
            label="Field with Error"
            placeholder="Enter text here"
            value=""
            onChange={() => {}}
            error="This field has an error"
          />
        </div>
      </section>

      <section>
        <h2 className={typography.h2}>Badges</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="badge-primary">Primary Badge</span>
          <span className="badge-success">Success Badge</span>
          <span className="badge-warning">Warning Badge</span>
          <span className="badge-error">Error Badge</span>
        </div>
      </section>

      <section>
        <h2 className={typography.h2}>Cards</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className={typography.h3}>Standard Card</h3>
            <p className={`${typography.bodyNormal} mt-2`}>
              This is the standard card with shadow and hover effect.
            </p>
          </div>
          <div className="card-flat">
            <h3 className={typography.h3}>Flat Card</h3>
            <p className={`${typography.bodyNormal} mt-2`}>
              This is a flat card without shadow.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

// Usage guidelines
export const guidelines = {
  buttons: `
    - Use PrimaryButton for main actions
    - Use SecondaryButton for alternative actions
    - Use SuccessButton for confirming or completing actions
    - Use OutlineButton for less prominent actions
    - Keep button text concise and action-oriented
  `,
  colors: `
    - Use primary colors for interactive elements and emphasis
    - Use secondary colors for UI structure and text
    - Use semantic colors (success, warning, error) for feedback and status
  `,
  spacing: `
    - Maintain consistent spacing between related elements
    - Use larger spacing to separate distinct sections
    - Follow the spacing scale: xs (4px), sm (8px), md (16px), lg (24px), xl (32px)
  `,
  typography: `
    - Maintain consistent typography hierarchy
    - Avoid using too many font sizes or weights
    - Use semantic elements (h1, h2, etc.) appropriately
  `,
};

export default {
  colors,
  typography,
  spacing,
  guidelines,
};
