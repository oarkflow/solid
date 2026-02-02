import { createTransition, type FC } from '@/core/velocity';
import { appStore, counter, theme, addActivity } from '@/app/stores/app';

export const HomePage: FC = () => {
    const [themePending, startThemeTransition] = createTransition();

    return (
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reactive Store</h2>
                <p class="text-gray-600 dark:text-gray-400">State is persisted and fully reactive.</p>
            </div>

            <div class="space-y-6">
                <div class="flex flex-wrap gap-3">
                    <button
                        class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                        onClick={() => {
                            appStore.patch(prev => ({ counter: prev.counter + 1 }));
                            addActivity('Counter incremented');
                        }}
                    >
                        Increment ({counter})
                    </button>
                    <button
                        class="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white px-4 py-2 rounded-md font-medium transition-colors"
                        onClick={() => {
                            appStore.patch(prev => ({ counter: Math.max(0, prev.counter - 1) }));
                            addActivity('Counter decremented');
                        }}
                    >
                        Decrement
                    </button>
                </div>

                <div class="flex flex-wrap gap-3 items-center">
                    <button
                        class="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                        onClick={() => startThemeTransition(() => {
                            appStore.update('preferences.theme', theme() === 'light' ? 'dark' : 'light');
                            addActivity('Theme toggled');
                        })}
                    >
                        Toggle Theme ({theme})
                    </button>
                </div>

                <div class="text-sm text-gray-500 dark:text-gray-400">
                    Palette status: {() => themePending() ? 'Applying theme…' : 'Synced'}
                </div>
            </div>
        </div>
    );
};
