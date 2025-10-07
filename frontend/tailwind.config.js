import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#60a5fa", // A softer, sky-blue for primary actions
          "secondary": "#9ca3af", // A lighter, more subtle gray for secondary elements
          "accent": "#34d399", // A gentle, minty green for accents
          "neutral": "#f9fafb", // Very light neutral background
          "base-100": "#ffffff", // Pure white background
          "info": "#67e8f9", // Light cyan for info
          "success": "#4ade80", // A more pastel green for success
          "warning": "#fbbf24", // Soft amber for warning
          "error": "#fca5a5", // Muted red for error
          "--rounded-box": "0.75rem", // Slightly smaller border radius for cards
          "--rounded-btn": "0.5rem", // Border radius for buttons
          "--rounded-badge": "1.5rem", // Border radius for badges
          "--animation-btn": "0.25s", // Duration for button animations
          "--animation-input": "0.2s", // Duration for input animations
          "--btn-text-case": "normal", // Normal case for button text (less assertive)
          "--btn-focus-scale": "0.95", // Scale factor for button focus
          "--navbar-padding": "0.5rem", // Padding for navbar
          "--border-btn": "1px", // Border width for buttons
        },
      },
      "night",
    ],
  },
};
