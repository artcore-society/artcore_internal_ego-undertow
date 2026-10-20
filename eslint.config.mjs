import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import pluginJs from '@eslint/js';
import tsEslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';

export default defineConfigWithVueTs(
	{
		ignores: ['node_modules', 'dist']
	},
	{
		languageOptions: {
			globals: {
				...globals.browser
			},
			parserOptions: {
				parser: tsEslint.parser
			}
		}
	},
	pluginJs.configs.recommended,
	pluginVue.configs['flat/recommended'],
	vueTsConfigs.strict,
	{
		rules: {
			'no-undef': 'off',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'explicit', overrides: { constructors: 'off' } }],
			'@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
			'vue/multi-word-component-names': 'off',
			'vue/require-default-prop': 'off',
			'vue/component-name-in-template-casing': ['error', 'PascalCase', { registeredComponentsOnly: false }],
			'vue/html-self-closing': [
				'error',
				{
					html: { void: 'any', normal: 'always', component: 'always' },
					svg: 'always',
					math: 'always'
				}
			]
		}
	},
	{
		files: ['**/*.vue'],
		rules: {
			'@typescript-eslint/explicit-function-return-type': 'off'
		}
	},
	prettier
);
