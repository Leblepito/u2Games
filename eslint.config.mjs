import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  { 
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "out/**",
      "next-env.d.ts"
    ] 
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // R3F SSR safety: Canvas + the R3F runtime must NOT be imported
  // from `app/` or `pages/` (server-rendered) — they go through
  // `components/canvas/GameCanvas.tsx`, which is loaded via
  // `next/dynamic({ ssr: false })`. CLAUDE.md "Critical Rules / R3F".
  {
    files: ["src/app/**/*.{ts,tsx}", "src/pages/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@react-three/fiber",
              importNames: ["Canvas"],
              message:
                "Don't import Canvas from app/pages — wrap it in a component under src/components/canvas/ and load that with next/dynamic({ ssr: false }).",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
