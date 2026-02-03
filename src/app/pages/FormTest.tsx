/**
 * Minimal Form Test Page - Ultra Simple
 */
import { createSignal, createEffect, type FC, useForm } from '@/core/velocity';

export const FormTestPage: FC = () => {
    // ===== Test 1: Direct signal (baseline - must work) =====
    const [text1, setText1] = createSignal('');

    // ===== Test 2: Form with manual bindings =====
    const form = useForm<{ name: string; agree: boolean }>({
        defaultValues: { name: '', agree: false },
    });

    // Debug effect
    createEffect(() => {
        console.log('[Effect] form values changed:', form.getValues());
    });

    return (
        <section class="p-8 max-w-lg mx-auto space-y-6">
            <h1 class="text-2xl font-bold">Form Debug Test</h1>

            {/* Test 1: Baseline - Direct Signal */}
            <div class="p-4 border-2 border-gray-300 rounded">
                <h2 class="font-semibold mb-2 text-gray-700">Test 1: Direct Signal (Baseline)</h2>
                <input
                    type="text"
                    class="border p-2 w-full rounded"
                    placeholder="Type here..."
                    value={text1}
                    onInput={(e: any) => setText1(e.target.value)}
                />
                <p class="mt-2 text-sm bg-gray-100 p-2 rounded">
                    Signal value: <strong>{text1}</strong>
                </p>
            </div>

            {/* Test 2: useForm - Text Input */}
            <div class="p-4 border-2 border-blue-300 rounded">
                <h2 class="font-semibold mb-2 text-blue-700">Test 2: useForm Text Input (Manual)</h2>
                <input
                    {...form.register('name')}
                    type="text"
                    class="border p-2 w-full rounded"
                    placeholder="Type here..."
                    onInput={(e: any) => {
                        console.log('[Test2] onChange fired, value:', e.target.value);
                    }}
                />
                <p class="mt-2 text-sm bg-blue-100 p-2 rounded">
                    form.getValues('name'): <strong>{() => String(form.getValues('name') || '')}</strong>
                </p>
                <p class="text-sm bg-blue-50 p-2 rounded mt-1">
                    getValues(): <strong>{() => JSON.stringify(form.getValues())}</strong>
                </p>
            </div>

            {/* Test 3: useForm - Checkbox */}
            <div class="p-4 border-2 border-green-300 rounded">
                <h2 class="font-semibold mb-2 text-green-700">Test 3: useForm Checkbox</h2>
                <label class="flex items-center gap-2">
                    <input
                        {...form.register('agree')}
                        type="checkbox"
                        class="w-5 h-5"
                        onChange={(e: any) => {
                            console.log('[Test3] onChange fired, checked:', e.target.checked);
                        }}
                    />
                    <span>I agree to terms</span>
                </label>
                <p class="mt-2 text-sm bg-green-100 p-2 rounded">
                    form.getValues('agree'): <strong>{() => String(form.getValues('agree'))}</strong>
                </p>
            </div>

            {/* Test 4: useForm - Spread syntax */}
            <div class="p-4 border-2 border-purple-300 rounded">
                <h2 class="font-semibold mb-2 text-purple-700">Test 4: useForm Spread</h2>
                <input
                    {...form.register('name')}
                    type="text"
                    class="border p-2 w-full rounded"
                    placeholder="Type here (spread)..."
                />
                <p class="mt-2 text-sm bg-purple-100 p-2 rounded">
                    getValues('name'): <strong>{() => String(form.getValues('name'))}</strong>
                </p>
            </div>
        </section>
    );
};
