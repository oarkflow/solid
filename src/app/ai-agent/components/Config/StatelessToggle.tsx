import { h } from '@/core/ui';
import { Switch } from '@/core/ui/forms/Switch';

interface Props {
    value: boolean;
    onChange: (val: boolean) => void;
}

export function StatelessToggle({ value, onChange }: Props) {
    return (
        <div class="flex items-center justify-between p-2 border rounded-md">
            <span class="text-sm font-medium text-gray-700">Stateless Mode</span>
            <Switch
                checked={value}
                onChange={(e: any) => onChange(e.target.checked)}
                size="sm"
            />
        </div>
    );
}
