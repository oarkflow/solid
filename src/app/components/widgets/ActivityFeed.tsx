import type { FC } from '@/core/velocity';
import { appStore } from '@/app/stores/app';

export const ActivityFeed: FC = () => (
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div class="space-y-2 max-h-64 overflow-y-auto">
            {() => appStore.state().activity.length
                ? appStore.state().activity.map(entry => 
                    <div class="text-sm text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded">{entry}</div>
                  )
                : <div class="text-sm text-gray-500 dark:text-gray-400 italic">No activity yet.</div>
            }
        </div>
    </div>
);
