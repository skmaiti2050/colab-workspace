/** @type {import("prettier").Config} */
const config = {
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  endOfLine: 'auto',
  plugins: ['prettier-plugin-organize-imports'],
};

export default config;
