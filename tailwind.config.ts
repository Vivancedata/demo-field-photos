import type { Config } from "tailwindcss";
import vivanceTailwindPreset from "@vivancedata/ui/tailwind";

// Same preset as vivancedata, learn and crm: a demo is a first impression of
// the practice, so it renders in the practice's own design system.
const config: Config = {
  presets: [vivanceTailwindPreset],
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/@vivancedata/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
