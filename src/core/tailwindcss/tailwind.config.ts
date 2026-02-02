/**
 * Tailwind CSS Configuration
 *
 * Customize your theme by extending or overriding default values.
 * This file works similarly to tailwind.config.js in standard Tailwind CSS.
 *
 * Usage:
 * - Use `extend` to add new values while keeping defaults
 * - Override theme properties directly to replace defaults entirely
 */

import type { TailwindConfig } from './tailwind.defaults';

const config: TailwindConfig = {
    theme: {
        // Extend default theme (adds to existing values)
        extend: {
            colors: {
                // Custom brand colors - use as: bg-primary-500, text-primary-600, etc.
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                    950: '#172554'
                },
                // Secondary brand color - use as: bg-secondary-500, etc.
                secondary: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617'
                },
                // Accent color - use as: bg-accent-500, border-accent-400, etc.
                accent: {
                    50: '#fdf4ff',
                    100: '#fae8ff',
                    200: '#f5d0fe',
                    300: '#f0abfc',
                    400: '#e879f9',
                    500: '#d946ef',
                    600: '#c026d3',
                    700: '#a21caf',
                    800: '#86198f',
                    900: '#701a75',
                    950: '#4a044e'
                },
                // Simple single-value colors
                brand: '#3b82f6',
                success: '#22c55e',
                warning: '#f59e0b',
                error: '#ef4444',
                info: '#0ea5e9'
            },
            spacing: {
                // Custom spacing values - use as: p-128, m-144, etc.
                '128': '32rem',
                '144': '36rem'
            },
            borderRadius: {
                // Custom border radius - use as: rounded-4xl, etc.
                '4xl': '2rem'
            }
        }

        // To completely override defaults (replaces instead of extends):
        // colors: { ... },
        // spacing: { ... },
    }
};

export default config;
