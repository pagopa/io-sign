import pagopa from "@pagopa/eslint-config";

export default [
  ...pagopa,
  {
    rules: {
      "comma-dangle": "off",
      "perfectionist/sort-classes": "off",
      "perfectionist/sort-enums": "off",
      "perfectionist/sort-imports": "off",
      "perfectionist/sort-interfaces": "off",
      "perfectionist/sort-intersection-types": "off",
      "perfectionist/sort-objects": "off",
      "perfectionist/sort-object-types": "off",
      "perfectionist/sort-union-types": "off",
      "@typescript-eslint/array-type": ["error", { default: "generic" }],
      "@typescript-eslint/no-inferrable-types": "off"
    }
  },
  {
    ignores: [
      "node_modules",
      "dist",
      "**/*.spec.ts",
      "*.yaml",
      "**/models/*.ts",
      "*.pdf",
      "*.json"
    ]
  }
];