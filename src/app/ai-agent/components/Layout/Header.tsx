import { h } from '@/core/ui';
import { Button } from '@/core/ui';
import { Menu } from '@/core/icons';

interface Props {
    onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: Props) {
    return (
        <header class="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between lg:hidden">
            <Button variant="ghost" size="sm" onClick={onToggleSidebar}>
                <Menu class="w-5 h-5" />
            </Button>
            <span class="font-bold">AI Agent</span>
            <div class="w-8" /> {/* Spacer */}
        </header>
    );
}
