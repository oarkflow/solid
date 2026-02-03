/**
 * Register Page - Simple Working Version
 */

import {
    createSignal,
    createMemo,
    type FC,
    startTransition,
    useForm,
} from '@/core/velocity';
import { authActions } from '@/app/stores/auth';
import { addActivity } from '@/app/stores/app';
import { getRouterApi } from '@/app/router/navigation';

// Simple type without schema
interface RegisterFormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    displayName: string;
    role: string;
    acceptTerms: boolean;
    notifyEmail: boolean;
    notifySms: boolean;
}

export const RegisterPage: FC = () => {
    const router = getRouterApi();
    const [showPassword, setShowPassword] = createSignal(false);
    const [submitResult, setSubmitResult] = createSignal<{ success: boolean; message: string } | null>(null);

    // Initialize form WITHOUT schema validation
    const form = useForm<RegisterFormData>({
        defaultValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            displayName: '',
            role: 'developer',
            acceptTerms: false,
            notifyEmail: true,
            notifySms: false,
        },
    });

    // Pre-register all fields
    const usernameField = form.register('username');
    const emailField = form.register('email');
    const passwordField = form.register('password');
    const confirmPasswordField = form.register('confirmPassword');
    const displayNameField = form.register('displayName');
    const roleField = form.register('role');
    const acceptTermsField = form.register('acceptTerms');
    const notifyEmailField = form.register('notifyEmail');
    const notifySmsField = form.register('notifySms');

    // Watch password for strength indicator
    const watchedPassword = form.watch('password');

    // Password strength
    const passwordStrength = createMemo(() => {
        const pwd = watchedPassword || '';
        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (pwd.length >= 12) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/[a-z]/.test(pwd)) strength++;
        if (/[0-9]/.test(pwd)) strength++;
        if (/[!@#$%^&*]/.test(pwd)) strength++;
        return strength;
    });

    const strengthLabel = createMemo(() => {
        const s = passwordStrength();
        if (s <= 1) return { text: 'Weak', color: 'bg-red-500' };
        if (s <= 3) return { text: 'Fair', color: 'bg-yellow-500' };
        if (s <= 5) return { text: 'Good', color: 'bg-blue-500' };
        return { text: 'Strong', color: 'bg-green-500' };
    });

    // Simple submit handler
    const handleFormSubmit = (e: Event) => {
        e.preventDefault();
        const data = form.getValues();
        console.log('Form data:', data);

        // Basic validation
        if (!data.username) {
            setSubmitResult({ success: false, message: 'Username is required' });
            return;
        }
        if (!data.email) {
            setSubmitResult({ success: false, message: 'Email is required' });
            return;
        }
        if (!data.password || data.password.length < 8) {
            setSubmitResult({ success: false, message: 'Password must be at least 8 characters' });
            return;
        }
        if (data.password !== data.confirmPassword) {
            setSubmitResult({ success: false, message: 'Passwords do not match' });
            return;
        }
        if (!data.acceptTerms) {
            setSubmitResult({ success: false, message: 'You must accept the terms' });
            return;
        }

        setSubmitResult({ success: true, message: 'Registration successful!' });
        authActions.login(data.username);
        addActivity(`Registered as ${data.username}`);

        setTimeout(() => {
            startTransition(() => router.navigate('/dashboard'));
        }, 1500);
    };

    return (
        <div class="max-w-2xl mx-auto p-6">
            <div class="card">
                <h1 class="text-2xl font-bold mb-2">Create Account</h1>
                <p class="text-gray-600 mb-6">Simple registration form.</p>

                {/* Debug Panel */}
                <details class="mb-6 p-4 bg-gray-100 rounded-lg" open>
                    <summary class="cursor-pointer font-semibold">Form Values (Debug)</summary>
                    <pre class="mt-2 text-xs font-mono bg-white p-2 rounded overflow-auto">
                        {() => JSON.stringify(form.getValues(), null, 2)}
                    </pre>
                </details>

                <form onSubmit={handleFormSubmit} class="space-y-6">

                    {/* === Account === */}
                    <section>
                        <h2 class="text-lg font-semibold mb-4 border-b pb-2">Account</h2>

                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">Username *</label>
                            <input
                                type="text"
                                class="border p-2 w-full rounded"
                                placeholder="johndoe"
                                name={usernameField.name}
                                value={usernameField.value}
                                onInput={usernameField.onInput}
                                onBlur={usernameField.onBlur}
                                ref={usernameField.ref}
                            />
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">Email *</label>
                            <input
                                type="email"
                                class="border p-2 w-full rounded"
                                placeholder="john@example.com"
                                name={emailField.name}
                                value={emailField.value}
                                onInput={emailField.onInput}
                                onBlur={emailField.onBlur}
                                ref={emailField.ref}
                            />
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">Display Name</label>
                            <input
                                type="text"
                                class="border p-2 w-full rounded"
                                placeholder="John Doe"
                                name={displayNameField.name}
                                value={displayNameField.value}
                                onInput={displayNameField.onInput}
                                onBlur={displayNameField.onBlur}
                                ref={displayNameField.ref}
                            />
                        </div>
                    </section>

                    {/* === Password === */}
                    <section>
                        <h2 class="text-lg font-semibold mb-4 border-b pb-2">Password</h2>

                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">Password *</label>
                            <div class="relative">
                                <input
                                    type={showPassword() ? 'text' : 'password'}
                                    class="border p-2 w-full rounded pr-16"
                                    placeholder="••••••••"
                                    name={passwordField.name}
                                    value={passwordField.value}
                                    onInput={passwordField.onInput}
                                    onBlur={passwordField.onBlur}
                                    ref={passwordField.ref}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword())}
                                    class="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600"
                                >
                                    {showPassword() ? 'Hide' : 'Show'}
                                </button>
                            </div>

                            {/* Strength bar */}
                            <div class="mt-2 flex gap-1">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div class={`h-1 flex-1 rounded ${i <= passwordStrength() ? strengthLabel().color : 'bg-gray-200'}`} />
                                ))}
                            </div>
                            <p class="text-xs text-gray-600 mt-1">Strength: {strengthLabel().text}</p>
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">Confirm Password *</label>
                            <input
                                type={showPassword() ? 'text' : 'password'}
                                class="border p-2 w-full rounded"
                                placeholder="••••••••"
                                name={confirmPasswordField.name}
                                value={confirmPasswordField.value}
                                onInput={confirmPasswordField.onInput}
                                onBlur={confirmPasswordField.onBlur}
                                ref={confirmPasswordField.ref}
                            />
                        </div>
                    </section>

                    {/* === Role === */}
                    <section>
                        <h2 class="text-lg font-semibold mb-4 border-b pb-2">Profile</h2>

                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">Role</label>
                            <select
                                class="border p-2 w-full rounded"
                                name={roleField.name}
                                value={roleField.value}
                                onChange={roleField.onChange}
                                onBlur={roleField.onBlur}
                                ref={roleField.ref}
                            >
                                <option value="developer">Developer</option>
                                <option value="designer">Designer</option>
                                <option value="manager">Manager</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </section>

                    {/* === Notifications === */}
                    <section>
                        <h2 class="text-lg font-semibold mb-4 border-b pb-2">Notifications</h2>

                        <div class="space-y-2">
                            <label class="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    class="w-4 h-4"
                                    name={notifyEmailField.name}
                                    checked={notifyEmailField.checked}
                                    onChange={notifyEmailField.onChange}
                                    ref={notifyEmailField.ref}
                                />
                                <span>Email notifications</span>
                            </label>

                            <label class="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    class="w-4 h-4"
                                    name={notifySmsField.name}
                                    checked={notifySmsField.checked}
                                    onChange={notifySmsField.onChange}
                                    ref={notifySmsField.ref}
                                />
                                <span>SMS notifications</span>
                            </label>
                        </div>
                    </section>

                    {/* === Terms === */}
                    <section>
                        <div class="mb-4">
                            <label class="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    class="w-4 h-4"
                                    name={acceptTermsField.name}
                                    checked={acceptTermsField.checked}
                                    onChange={acceptTermsField.onChange}
                                    ref={acceptTermsField.ref}
                                />
                                <span>I accept the Terms and Conditions *</span>
                            </label>
                        </div>

                        {submitResult() && (
                            <div class={`p-3 rounded mb-4 ${submitResult()!.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {submitResult()!.message}
                            </div>
                        )}

                        <div class="flex gap-3">
                            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1">
                                Create Account
                            </button>
                            <button type="button" onClick={() => form.reset()} class="px-4 py-2 border rounded hover:bg-gray-50">
                                Reset
                            </button>
                        </div>
                    </section>
                </form>
            </div>
        </div>
    );
};
