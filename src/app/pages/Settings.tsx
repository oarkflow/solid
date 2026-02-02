import type { FC } from '@/velocity';
import { appStore, addActivity } from '@/app/stores/app';

export const SettingsPage: FC = () => (
    <section class="card">
        <h2>Security Controls</h2>
        <p class="muted">Fine-grained flags stored in reactive state.</p>
        <div class="row gap">
            <button
                class="button ghost"
                onClick={() => {
                    appStore.update('flags.secureMode', (v: boolean) => !v);
                    addActivity('Secure mode toggled');
                }}
            >
                Secure Mode: {() => (appStore.state().flags.secureMode ? 'On' : 'Off')}
            </button>
            <button
                class="button ghost"
                onClick={() => {
                    appStore.update('flags.betaAccess', (v: boolean) => !v);
                    addActivity('Beta access toggled');
                }}
            >
                Beta Access: {() => (appStore.state().flags.betaAccess ? 'On' : 'Off')}
            </button>
        </div>
    </section>
);
