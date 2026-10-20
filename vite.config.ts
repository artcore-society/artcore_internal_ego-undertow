import vue from '@vitejs/plugin-vue';
import glsl from 'vite-plugin-glsl';
import sassGlobImports from 'vite-plugin-sass-glob-import';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue(), glsl(), sassGlobImports()]
});
