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
                // CSS Variables for design system
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: 'hsl(var(--card))',
                'card-foreground': 'hsl(var(--card-foreground))',
                popover: 'hsl(var(--popover))',
                'popover-foreground': 'hsl(var(--popover-foreground))',
                primary: 'hsl(var(--primary))',
                'primary-foreground': 'hsl(var(--primary-foreground))',
                secondary: 'hsl(var(--secondary))',
                'secondary-foreground': 'hsl(var(--secondary-foreground))',
                muted: 'hsl(var(--muted))',
                'muted-foreground': 'hsl(var(--muted-foreground))',
                accent: 'hsl(var(--accent))',
                'accent-foreground': 'hsl(var(--accent-foreground))',
                destructive: 'hsl(var(--destructive))',
                'destructive-foreground': 'hsl(var(--destructive-foreground))',
                success: 'hsl(var(--success))',
                'success-foreground': 'hsl(var(--success-foreground))',
                warning: 'hsl(var(--warning))',
                'warning-foreground': 'hsl(var(--warning-foreground))',
                info: 'hsl(var(--info))',
                'info-foreground': 'hsl(var(--info-foreground))',
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
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
