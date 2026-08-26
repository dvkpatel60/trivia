import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/dist-types/**",
      "**/node_modules/**",
      "**/*.tsbuildinfo",
      // esbuild output from `npm run dev:netlify`, and netlify dev's own
      // serve directory. Both are gitignored; flat config does not read
      // .gitignore, so they have to be named here too.
      "netlify/functions/*.mjs",
      "**/.netlify/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        // `const { solution: _solution, ...rest }` is how a question is
        // published, so an underscore-prefixed binding is intentional.
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
);
