import globals from "globals";
import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import pluginN from "eslint-plugin-n";

export default defineConfig([
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
    },
    rules: {
      ...pluginN.configs["recommended"].rules,
      // Optional extra rules:
      "n/no-missing-require": "error",
      "n/no-unpublished-require": "error", // you can turn this on if you want stricter checks
    },
  }
]);
