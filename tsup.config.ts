import { defineConfig } from 'tsup';

export default defineConfig({
	clean: true,
	entry: ['src/**/*.ts'],
	format: ['cjs'],
	minify: false,
	skipNodeModulesBundle: true,
	sourcemap: true,
	target: 'es2020',
	tsconfig: 'src/tsconfig.json',
	keepNames: true,
	treeshake: true,
	bundle: true,
	splitting: false
});
