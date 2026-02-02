import { createTransition, type FC } from '@/core/velocity';
import { appStore, counter, theme, accent, addActivity } from '@/app/stores/app';

export const HomePage: FC = () => {
    const [themePending, startThemeTransition] = createTransition();

    return (
        <section class="card">
            <h2>Reactive Store</h2>
            <p class="muted">State is persisted and fully reactive.</p>

            <div class="row gap">
                <button class="button" onClick={() => {
                    appStore.patch(prev => ({ counter: prev.counter + 1 }));
                    addActivity('Counter incremented');
                }}>
                    Increment ({counter})
                </button>
                <button class="button ghost" onClick={() => {
                    appStore.patch(prev => ({ counter: Math.max(0, prev.counter - 1) }));
                    addActivity('Counter decremented');
                }}>
                    Decrement
                </button>
            </div>

            <div class="row gap">
                <button
                    class="button ghost"
                    onClick={() => startThemeTransition(() => {
                        appStore.update('preferences.theme', theme() === 'light' ? 'dark' : 'light');
                        addActivity('Theme toggled');
                    })}
                >
                    Toggle Theme ({theme})
                </button>
                <input
                    class="color"
                    type="color"
                    value={accent}
                    onChange={(event: any) => {
                        const value = event.target.value;
                        startThemeTransition(() => {
                            appStore.update('preferences.accent', value);
                            addActivity('Accent updated');
                        });
                    }}
                />
            </div>
            <div class="muted">
                Palette status: {() => themePending() ? 'Applying theme…' : 'Synced'}
            </div>
        </section>
    );
};
