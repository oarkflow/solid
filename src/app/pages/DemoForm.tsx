import { useForm, type FC, createEffect, createSignal, createMemo } from '@/core/velocity';

interface ContactForm {
    name: string;
    email: string;
    message: string;
}

export const DemoForm: FC = () => {
    // Test 1: Raw signal (should work)
    const [count, setCount] = createSignal(0);

    createEffect(() => {
        console.log('[TEST] count changed:', count());
    });

    const { register, handleSubmit, errors, formState, isSubmitting, getValues, isValid } = useForm<ContactForm>({
        defaultValues: { name: '', email: '', message: '' },
        mode: 'onBlur',
    });

    // Check if form can be submitted: all required fields filled and no errors
    const canSubmit = createMemo(() => {
        const vals = getValues();
        const hasErrors = Object.keys(errors()).length > 0;
        const allRequiredFilled = vals.name?.trim() && vals.email?.trim() && vals.message?.trim();
        return !hasErrors && allRequiredFilled && !isSubmitting();
    });

    // Debug effect to track changes
    createEffect(() => {
        console.log('[DemoForm] values changed:', getValues());
    });

    createEffect(() => {
        console.log('[DemoForm] errors changed:', errors());
    });

    createEffect(() => {
        console.log('[DemoForm] isSubmitting changed:', isSubmitting());
    });

    createEffect(() => {
        console.log('[DemoForm] canSubmit changed:', canSubmit());
    });

    return (
        <div class="max-w-md mx-auto p-6">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-xl font-bold mb-4">Contact Form</h2>

                {/* Test button */}
                <button
                    type="button"
                    onClick={() => setCount(c => c + 1)}
                    class="mb-4 px-4 py-2 bg-green-600 text-white rounded"
                >
                    Test Signal: {count}
                </button>

                <form onSubmit={handleSubmit((data) => {
                    console.log('Form submitted:', data);
                    alert('Form submitted! Check console.');
                })} class="space-y-4">

                    <div>
                        <label class="block text-sm font-medium mb-1">Name *</label>
                        <input
                            {...register('name', { required: 'Name is required' })}
                            type="text"
                            placeholder="Enter your name"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {() => {
                            const error = errors().name;
                            return error ? (
                                <p class="text-sm text-red-600 mt-1">{error.message}</p>
                            ) : null;
                        }}
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-1">Email *</label>
                        <input
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: 'Enter a valid email address'
                                }
                            })}
                            type="email"
                            placeholder="you@example.com"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {() => {
                            const error = errors().email;
                            return error ? (
                                <p class="text-sm text-red-600 mt-1">{error.message}</p>
                            ) : null;
                        }}
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-1">Message *</label>
                        <textarea
                            {...register('message', {
                                required: 'Message is required',
                                minLength: {
                                    value: 10,
                                    message: 'Message must be at least 10 characters'
                                }
                            })}
                            placeholder="Your message..."
                            rows={4}
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {() => {
                            const error = errors().message;
                            return error ? (
                                <p class="text-sm text-red-600 mt-1">{error.message}</p>
                            ) : null;
                        }}
                    </div>
                    {() => JSON.stringify(formState())}

                    <button
                        type="submit"
                        disabled={canSubmit}
                        class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {() => isSubmitting() ? 'Sending...' : 'Send Message'}
                    </button>
                </form>

                {/* Debug panel */}
                <details class="mt-4 p-3 bg-gray-100 rounded text-xs">
                    <summary class="cursor-pointer font-semibold">Debug Info</summary>
                    <pre class="mt-2 overflow-auto">
                        {() => JSON.stringify({
                            values: formState().errors,
                            isValid: formState().isValid,
                            isDirty: formState().isDirty,
                        }, null, 2)}
                    </pre>
                </details>
            </div>
        </div>
    );
};
