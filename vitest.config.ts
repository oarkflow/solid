import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/core/velocity/**/*.ts', 'src/core/velocity/**/*.tsx'],
            exclude: ['**/__tests__/**', '**/devtools.ts'],
        },
    },
});
