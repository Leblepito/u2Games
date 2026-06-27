import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "out/**",
      "next-env.d.ts",
      "src/generated/**",
      "scripts/**",
    ],
  },

  // TypeScript flat preset (recommended — type-checked değil, hızlı)
  ...tseslint.configs.recommended,

  // Underscore-prefixed args/vars = "intentional unused" (API stability için)
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },

  // Next.js plugin — direkt flat config (FlatCompat YOK; circular JSON oluşmaz)
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },

  // FSD layer cone — see docs/specs/fsd-architecture.md.
  // Lower layers must not import from higher layers. Order
  // (low → high): shared → entities → features → widgets → app.
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/entities/*"], message: "FSD: shared/ may not import from entities/." },
            { group: ["@/features/*"], message: "FSD: shared/ may not import from features/." },
            { group: ["@/widgets/*"],  message: "FSD: shared/ may not import from widgets/." },
            { group: ["@/app/*"],      message: "FSD: shared/ may not import from app/." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/entities/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/features/*"], message: "FSD: entities/ may not import from features/." },
            { group: ["@/widgets/*"],  message: "FSD: entities/ may not import from widgets/." },
            { group: ["@/app/*"],      message: "FSD: entities/ may not import from app/." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/widgets/*"],  message: "FSD: features/ may not import from widgets/." },
            { group: ["@/app/*"],      message: "FSD: features/ may not import from app/." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/widgets/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/app/*"], message: "FSD: widgets/ may not import from app/." },
          ],
        },
      ],
    },
  },

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
