interface LintStagedConfig {
  [key: string]: string | string[];
}

const config: LintStagedConfig = {
  'src/**/*.{ts,js}': ['eslint --fix', 'prettier --write'],
  'test/**/*.{ts,js}': ['eslint --fix', 'prettier --write'],
  '**/*.{json,md}': ['prettier --write'],
};

export default config;