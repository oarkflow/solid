/**
 * Example Usage of the SVG Icon System with JSX
 * This file demonstrates how to use the icons as components
 */

import {
    Home,
    Search,
    User,
    Settings,
    Heart,
    Loader,
    Bell,
    CheckCircle,
    AlertTriangle,
    Github,
    Calendar,
    Mail
} from '@/core/icons';
import Icons from '@/core/icons';

import { createIcon, pathToIconNode, circleToIconNode, type IconProps } from '@/core/icons/Icon';
import { Card, CardBody, CardHeader } from '@/core/ui/data-display/Card';
import { Container } from '@/core/ui/layout/Container';
import { Stack } from '@/core/ui/layout/Stack';
import { Flex } from '@/core/ui/layout/Flex';
import { Grid } from '@/core/ui/layout/Grid';

// ============================================================================
// CUSTOM ICONS
// ============================================================================

// Simple custom icon - a smiley face
const Smiley = createIcon('smiley', [
    circleToIconNode(12, 12, 10),
    circleToIconNode(9, 9, 1),
    circleToIconNode(15, 9, 1),
    pathToIconNode('M8 14s1.5 2 4 2 4-2 4-2'),
]);

// Complex custom icon - a house with smoke
const HouseWithSmoke = createIcon('house-with-smoke', [
    pathToIconNode('M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'),
    pathToIconNode('M9 22V12h6v10'),
    circleToIconNode(15, 5, 1),
    circleToIconNode(16, 3, 0.5),
    circleToIconNode(17, 2, 0.5),
]);

export default function IconExample() {
    return (
        <Container size="lg" className="py-8">
            <div class="flex flex-wrap justify-center gap-4 items-center align-middle">
                {Object.entries(Icons).map(([name, IconComponent]) => {
                    const Icon = IconComponent as any;
                    return (
                        <div key={name} className="flex flex-col items-center justify-center p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors w-32 h-32">
                            <Icon size={28} />
                            <span class="text-xs text-muted-foreground truncate w-full text-center mt-2" title={name}>{name}</span>
                        </div>
                    );
                })}
            </div>
        </Container>
    );
}
