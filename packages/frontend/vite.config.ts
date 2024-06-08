// Vite Configuration
// https://vitejs.dev/config/#configuring-vite

import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        target: 'esnext',
    },
    plugins: [sveltekit()],
    test: {
        environmentMatchGlobs: [
            [
                '**/*.component.{test,spec}.?(c|m)[jt]s?(x)',
                'happy-dom',
            ],
        ],
        globals: true,
        include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    },
})
