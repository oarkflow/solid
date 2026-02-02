import { createSignal, createEffect, onCleanup, createTransition, createErrorBoundary, type FC } from '@/velocity';
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
        <section class="card">
            <h2>Job Runner</h2>
            <p class="muted">Error boundaries capture failed background work safely.</p>
            <div class="row gap">
                <button class="button small" onClick={runJob} disabled={() => jobPending() || mode() === 'running'}>
                    {() => jobPending() ? 'Scheduling…' : 'Run Job'}
                </button>
                <button class="button ghost small" onClick={triggerFailure}>Trigger Failure</button>
                <button class="button ghost small" onClick={resetJob}>Reset</button>
            </div>
            <div class="list">
                {() => error()
                    ? (
                        <div class="muted">
                            <strong>Last error:</strong> {error()?.message}
                        </div>
                    )
                    : (
                        <div class="muted">
                            <strong>Status:</strong> {mode() === 'running' ? 'Executing secure workflow…' : 'Idle'}
                        </div>
                    )
                }
            </div>
        </section>
    );
};
