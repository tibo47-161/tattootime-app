module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "script"
  },
  rules: {
    "no-unused-vars": ["warn", { "varsIgnorePattern": "^[A-Z_]" }],
    "no-undef": "off"
  }
};
