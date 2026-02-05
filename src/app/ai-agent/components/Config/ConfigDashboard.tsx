import { h, createSignal, createEffect } from '@/core/velocity';
import { Button, Textarea } from '@/core/ui';
import { api } from '../../services/api';

export function ConfigDashboard() {
    const [configJson, setConfigJson] = createSignal('');
    const [loading, setLoading] = createSignal(false);
    const [status, setStatus] = createSignal('');

    createEffect(() => {
        loadConfig();
    });

    const loadConfig = async () => {
        try {
            const cfg = await api.getConfig();
            setConfigJson(JSON.stringify(cfg, null, 2));
        } catch (e) {
            setStatus('Failed to load config');
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const parsed = JSON.parse(configJson());
            await api.saveConfig(parsed);
            setStatus('Config saved successfully');
            setTimeout(() => setStatus(''), 3000);
        } catch (e) {
            setStatus('Invalid JSON or Save Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div class="h-full flex flex-col p-4 space-y-4">
            <h2 class="text-xl font-bold">Configuration</h2>
            <Textarea
                value={configJson()}
                onInput={(e: any) => setConfigJson(e.target.value)}
                className="flex-1 font-mono text-xs"
                resize="none"
            />
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">{status()}</span>
                <Button
                    onClick={handleSave}
                    loading={loading()}
                    disabled={loading()}
                >
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
