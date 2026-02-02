import type { FC } from '@/core/velocity';
import { authStore, isAuthenticated } from '@/app/stores/auth';

export const SessionStatus: FC = () => (
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session Status</h3>
        <div class="space-y-3">
            <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Authenticated:</span>
                <span class={`text-sm font-medium ${
                    () => isAuthenticated() 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                }`}>
                    {() => isAuthenticated() ? 'Yes' : 'No'}
                </span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Token:</span>
                <span class="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {() => authStore.state().token ? authStore.state().token.slice(0, 8) + '…' : '—'}
                </span>
            </div>
        </div>
    </div>
);
