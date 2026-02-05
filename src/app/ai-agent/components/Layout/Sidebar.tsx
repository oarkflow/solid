import { h } from '@/core/ui';
import { Button } from '@/core/ui';
import { DomainSelector } from '../Config/DomainSelector';
import { StatelessToggle } from '../Config/StatelessToggle';
import { Home } from '@/core/icons'; // Guaranteed to exist from my earlier read

interface Props {
    domain: string;
    setDomain: (val: string) => void;
    stateless: boolean;
    setStateless: (val: boolean) => void;
    onReset: () => void;
    onToggleDashboard: () => void;
}

export function Sidebar({ domain, setDomain, stateless, setStateless, onReset, onToggleDashboard }: Props) {
    return (
        <aside class="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
            <div class="p-4 border-b border-gray-100 flex items-center gap-2">
                <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    AI
                </div>
                <span class="font-bold text-lg">Agent</span>
            </div>

            <div class="p-4 space-y-6 flex-1 overflow-y-auto">
                <DomainSelector value={domain} onChange={setDomain} />

                <StatelessToggle value={stateless} onChange={setStateless} />

                <div class="pt-4 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-600"
                        onClick={onToggleDashboard}
                    >
                        Configuration
                    </Button>
                </div>
            </div>

            <div class="p-4 border-t border-gray-100">
                <Button
                    variant="destructive"
                    mode="outline"
                    className="w-full"
                    onClick={onReset}
                >
                    Reset Memory
                </Button>
            </div>
        </aside>
    );
}
