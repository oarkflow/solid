import type { FC } from '@/core/velocity';
import { appStore, addActivity, theme } from '@/app/stores/app';

export const SettingsPage: FC = () => (
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Security Controls</h2>
            <p class="text-gray-600 dark:text-gray-400">Fine-grained flags stored in reactive state.</p>
        </div>
        <div class="space-y-4">
            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                    <h3 class="font-medium text-gray-900 dark:text-white">Theme</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Switch between light and dark mode</p>
                </div>
                <button
                    class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    onClick={() => {
                        appStore.update('preferences.theme', (v: 'light' | 'dark') => v === 'light' ? 'dark' : 'light');
                        addActivity(`Theme switched to ${theme() === 'light' ? 'dark' : 'light'}`);
                    }}
                >
                    {() => theme() === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                </button>
            </div>
            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                    <h3 class="font-medium text-gray-900 dark:text-white">Secure Mode</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Enhanced security features</p>
                </div>
                <button
                    class="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    onClick={() => {
                        appStore.update('flags.secureMode', (v: boolean) => !v);
                        addActivity('Secure mode toggled');
                    }}
                >
                    {() => (appStore.state().flags.secureMode ? 'Disable' : 'Enable')}
                </button>
            </div>
            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                    <h3 class="font-medium text-gray-900 dark:text-white">Beta Access</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Access to experimental features</p>
                </div>
                <button
                    class="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    onClick={() => {
                        appStore.update('flags.betaAccess', (v: boolean) => !v);
                        addActivity('Beta access toggled');
                    }}
                >
                    {() => (appStore.state().flags.betaAccess ? 'Disable' : 'Enable')}
                </button>
            </div>
        </div>
    </div>
);
