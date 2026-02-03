/**
 * Gradient utilities
 * Handles bg-gradient-to-{dir}, bg-gradient-radial, bg-gradient-conic
 */

export function resolveGradientUtility(prefix: string, value: string): Record<string, any> | null {
    // Accept both: 'bg-gradient-to-r' (prefix split as 'bg') and 'bg-gradient-to' prefix form
    const startsWithGradient = prefix === 'bg' && value && (value.startsWith('gradient-'));

    // Linear gradient direction utilities: bg-gradient-to-{dir}
    if (prefix === 'bg-gradient-to' || startsWithGradient && value.startsWith('gradient-to')) {
        // value may be 'r' (if prefix was 'bg-gradient-to') or 'gradient-to-r' (if prefix was 'bg')
        let dirKey = value;
        if (value && value.startsWith('gradient-to-')) dirKey = value.slice('gradient-to-'.length);

        const dirMap: Record<string, string> = {
            't': 'top',
            'tr': 'top right',
            'r': 'right',
            'br': 'bottom right',
            'b': 'bottom',
            'bl': 'bottom left',
            'l': 'left',
            'tl': 'top left',
        };
        const dir = dirMap[dirKey] || dirKey;
        const bg = `linear-gradient(to ${dir}, var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to))`;
        // If --tw-gradient-via is not set it will be ignored by the browser when empty
        return { backgroundImage: bg };
    }

    // Radial and conic gradient base utilities
    if (
        prefix === 'bg-gradient-radial' ||
        (prefix === 'bg' && value === 'gradient-radial') ||
        (prefix === 'bg-gradient' && value === 'radial')
    ) {
        return { backgroundImage: 'radial-gradient(var(--tw-gradient-stops))' };
    }

    if (
        prefix === 'bg-gradient-conic' ||
        (prefix === 'bg' && value === 'gradient-conic') ||
        (prefix === 'bg-gradient' && value === 'conic')
    ) {
        return { backgroundImage: 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))' };
    }

    return null;
}
