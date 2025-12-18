import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "src/pages/admin/Financeiro_NOVO.tsx", "src/pages/admin/PedidosSuperEvolved.tsx", "src/pages/admin/Recuperacao.tsx"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "prefer-const": "warn",
      "no-extra-boolean-cast": "warn",
      "no-useless-escape": "warn",
      "no-empty": "warn",
      "prefer-spread": "warn",
      "prefer-rest-params": "warn",
      "no-useless-catch": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "no-case-declarations": "warn",
    },
  }
);
