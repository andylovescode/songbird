import type { Plugin } from 'vite';

export default function (): Plugin {
	return {
		name: 'songbird-plugin-vite',
		config() {
			return {
				esbuild: {
					jsx: 'transform',
					jsxDev: false,
					jsxImportSource: '@songbird/core',
					jsxInject: `import { jsx } from '@songbird/core/jsx-runtime'`,
					jsxFactory: 'jsx.element',
					jsxFragment: 'jsx.frag',
				},
			};
		},
	};
}
