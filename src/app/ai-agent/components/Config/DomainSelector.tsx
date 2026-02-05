import { h } from '@/core/ui';
import { Select } from '@/core/ui';

interface Props {
    value: string;
    onChange: (val: string) => void;
}

export function DomainSelector({ value, onChange }: Props) {
    // Hardcoded for now, or fetch
    const options = [
        { label: 'General', value: 'general' },
        { label: 'Healthcare', value: 'healthcare' },
        { label: 'Coding', value: 'coding' },
        { label: 'Workflow', value: 'workflow' },
        { label: 'ReactFlow', value: 'reactflow' },
    ];

    return (
        <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-gray-500 uppercase">Domain</label>
            <Select
                options={options}
                value={value}
                onChange={(e: any) => onChange(e.target.value)}
                className="w-full"
            />
        </div>
    );
}
