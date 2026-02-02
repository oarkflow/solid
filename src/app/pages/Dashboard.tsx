import type { FC } from '@/core/velocity';
import { authStore, userName } from '@/app/stores/auth';
import { appStore } from '@/app/stores/app';

export const DashboardPage: FC = () => (
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Protected Dashboard</h2>
            <p class="text-gray-600 dark:text-gray-400">Only authenticated users can access this view.</p>
        </div>
        <div class="space-y-4">
            <div class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span class="font-medium text-gray-900 dark:text-white">User:</span>
                <span class="text-gray-700 dark:text-gray-300">{userName}</span>
            </div>
            <div class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span class="font-medium text-gray-900 dark:text-white">Last login:</span>
                <span class="text-gray-700 dark:text-gray-300">{() => authStore.state().lastLogin ?? '—'}</span>
            </div>
            <div class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span class="font-medium text-gray-900 dark:text-white">Secure mode:</span>
                <span class={`font-medium ${() => appStore.state().flags.secureMode ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {() => appStore.state().flags.secureMode ? 'Enabled' : 'Disabled'}
                </span>
            </div>
        </div>
    </div>
);
