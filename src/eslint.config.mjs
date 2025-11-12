import globals from "globals";
import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import pluginN from "eslint-plugin-n";
import pluginImport from "eslint-plugin-import";

const recommendedImportRules = (pluginImport && pluginImport.configs && pluginImport.configs.recommended && pluginImport.configs.recommended.rules) ? pluginImport.configs.recommended.rules : {};

export default defineConfig([
  //  js.configs.recommended,
   {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script", // use "module" if you use ESM imports
      globals: {
        // ESLint will now recognize Node globals
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
    plugins: {
      n: pluginN,
      import: pluginImport,
    },
    rules: {
      // Node checks
      ...pluginN.configs?.recommended?.rules,
      // Optional extra rules:
      "n/no-missing-require": "error",
      //"n/no-unpublished-require": "error", // you can turn this on if you want stricter checks
      
      // Import plugin rules: ensure unresolved imports are errors and case-sensitive
      ...recommendedImportRules,
      "import/no-unresolved": ["error", { caseSensitive: true }],
    },
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".json"],
        },
      },
    },
  }
]);
