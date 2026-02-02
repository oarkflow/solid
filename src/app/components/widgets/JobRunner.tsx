import { createSignal, createEffect, onCleanup, createTransition, createErrorBoundary, type FC } from '@/core/velocity';
import { addActivity } from '@/app/stores/app';

export const JobRunner: FC = () => {
    const [mode, setMode] = createSignal<'idle' | 'running' | 'fail'>('idle');
    const [jobPending, startJobTransition] = createTransition();
    const [error, { reset }] = createErrorBoundary({
        onError: err => addActivity(`Job failure: ${err.message}`),
    });

    createEffect(() => {
        if (mode() === 'fail') {
            throw new Error('Policy propagation failed – manual review required.');
        }
        if (mode() === 'running') {
            const timer = setTimeout(() => setMode('idle'), 900);
            onCleanup(() => clearTimeout(timer));
        }
    });

    const runJob = () => {
        startJobTransition(() => {
            setMode('running');
            addActivity('Secure job started');
        });
    };

    const triggerFailure = () => {
        setMode('fail');
    };

    const resetJob = () => {
        reset(() => setMode('idle'));
        addActivity('Job state reset');
    };

    return (
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Job Runner</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">Error boundaries capture failed background work safely.</p>
            </div>
            <div class="flex flex-wrap gap-2 mb-4">
                <button 
                    class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:bg-green-500 dark:hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:cursor-not-allowed" 
                    onClick={runJob} 
                    disabled={() => jobPending() || mode() === 'running'}
                >
                    {() => jobPending() ? 'Scheduling…' : 'Run Job'}
                </button>
                <button 
                    class="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors" 
                    onClick={triggerFailure}
                >
                    Trigger Failure
                </button>
                <button 
                    class="bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors" 
                    onClick={resetJob}
                >
                    Reset
                </button>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                {() => error()
                    ? (
                        <div class="text-sm text-red-600 dark:text-red-400">
                            <strong>Last error:</strong> {error()?.message}
                        </div>
                    )
                    : (
                        <div class="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Status:</strong> {mode() === 'running' ? 'Executing secure workflow…' : 'Idle'}
                        </div>
                    )
                }
            </div>
        </div>
    );
};
