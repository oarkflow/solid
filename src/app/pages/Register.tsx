/**
 * Register Page - With Production Validation
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

    const { register, handleSubmit, errors, formState, watch, isSubmitting } = useForm<RegisterFormData>({
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
        mode: 'onBlur',
        revalidateMode: 'onChange',
    });

    // Watch password for strength indicator
    const watchedPassword = watch('password');

    // Password strength
    const passwordStrength = createMemo(() => {
        const pwd = watchedPassword;
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

    const onSubmit = handleSubmit(
        (data) => {
            console.log('Form data:', data);
            setSubmitResult({ success: true, message: 'Registration successful!' });
            authActions.login(data.username);
            addActivity(`Registered as ${data.username}`);

            setTimeout(() => {
                startTransition(() => router.navigate('/dashboard'));
            }, 1500);
        },
        (formErrors) => {
            const firstError = Object.values(formErrors).find(Boolean);
            setSubmitResult({
                success: false,
                message: firstError?.message ?? 'Please fix validation errors above.',
            });
        }
    );

    return (
        <div class="max-w-2xl mx-auto p-6">
            <div class="card">
                <h1 class="text-2xl font-bold mb-2">Create Account</h1>
                <p class="text-gray-600 mb-6">Register with built-in validation.</p>

                <form onSubmit={onSubmit} class="space-y-6">

                    {/* === Account === */}
                    <section>
                        <h2 class="text-lg font-semibold mb-4 border-b pb-2">Account</h2>

                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">Username *</label>
                            <input
                                {...register('username', {
                                    required: 'Username is required',
                                    minLength: { value: 3, message: 'At least 3 characters' },
                                    maxLength: { value: 24, message: 'Must be 24 characters or fewer' },
                                    pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Only letters, numbers, and underscores' },
                                    setValueAs: (value: string) => value.trim(),
                                })}
                                type="text"
                                class="border p-2 w-full rounded"
                                placeholder="johndoe"
                            />
                            {() => {
                                const error = errors().username;
                                return error ? <p class="text-sm text-red-600 mt-1">{error.message}</p> : null;
                            }}
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">Email *</label>
                            <input
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: 'Enter a valid email address'
                                    },
                                    setValueAs: (value: string) => value.trim(),
                                })}
                                type="email"
                                class="border p-2 w-full rounded"
                                placeholder="john@example.com"
                            />
                            {() => {
                                const error = errors().email;
                                return error ? <p class="text-sm text-red-600 mt-1">{error.message}</p> : null;
                            }}
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">Display Name</label>
                            <input
                                {...register('displayName')}
                                type="text"
                                class="border p-2 w-full rounded"
                                placeholder="John Doe"
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
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: { value: 8, message: 'Password must be at least 8 characters' },
                                        validate: {
                                            hasUppercase: (value: string) => /[A-Z]/.test(value) || 'Include an uppercase letter',
                                            hasLowercase: (value: string) => /[a-z]/.test(value) || 'Include a lowercase letter',
                                            hasNumber: (value: string) => /\d/.test(value) || 'Include a number',
                                            hasSpecial: (value: string) => /[^A-Za-z0-9]/.test(value) || 'Include a special character',
                                        },
                                    })}
                                    type={showPassword() ? 'text' : 'password'}
                                    class="border p-2 w-full rounded pr-16"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword())}
                                    class="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600"
                                >
                                    {showPassword() ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            {() => {
                                const error = errors().password;
                                return error ? <p class="text-sm text-red-600 mt-1">{error.message}</p> : null;
                            }}

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
                                {...register('confirmPassword', {
                                    required: 'Please confirm your password',
                                    deps: ['password'],
                                    validate: (value: string, ctx) =>
                                        value === ctx.getValue('password') || 'Passwords must match',
                                })}
                                type={showPassword() ? 'text' : 'password'}
                                class="border p-2 w-full rounded"
                                placeholder="••••••••"
                            />
                            {() => {
                                const error = errors().confirmPassword;
                                return error ? <p class="text-sm text-red-600 mt-1">{error.message}</p> : null;
                            }}
                        </div>
                    </section>

                    {/* === Role === */}
                    <section>
                        <h2 class="text-lg font-semibold mb-4 border-b pb-2">Profile</h2>

                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">Role</label>
                            <select
                                {...register('role', { required: 'Select a role' })}
                                class="border p-2 w-full rounded"
                            >
                                <option value="developer">Developer</option>
                                <option value="designer">Designer</option>
                                <option value="manager">Manager</option>
                                <option value="other">Other</option>
                            </select>
                            {() => {
                                const error = errors().role;
                                return error ? <p class="text-sm text-red-600 mt-1">{error.message}</p> : null;
                            }}
                        </div>
                    </section>

                    {/* === Notifications === */}
                    <section>
                        <h2 class="text-lg font-semibold mb-4 border-b pb-2">Notifications</h2>

                        <div class="space-y-2">
                            <label class="flex items-center gap-2">
                                <input
                                    {...register('notifyEmail')}
                                    type="checkbox"
                                    class="w-4 h-4"
                                />
                                <span>Email notifications</span>
                            </label>

                            <label class="flex items-center gap-2">
                                <input
                                    {...register('notifySms')}
                                    type="checkbox"
                                    class="w-4 h-4"
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
                                    {...register('acceptTerms', {
                                        validate: (value: boolean) => value || 'You must accept the terms',
                                    })}
                                    type="checkbox"
                                    class="w-4 h-4"
                                />
                                <span>I accept the Terms and Conditions *</span>
                            </label>
                            {() => {
                                const error = errors().acceptTerms;
                                return error ? <p class="text-sm text-red-600 mt-2">{error.message}</p> : null;
                            }}
                        </div>

                        {submitResult() && (
                            <div class={`p-3 rounded mb-4 ${submitResult()!.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {submitResult()!.message}
                            </div>
                        )}

                        <div class="flex gap-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {() => isSubmitting() ? 'Creating...' : 'Create Account'}
                            </button>
                            <button type="button" onClick={() => window.location.reload()} class="px-4 py-2 border rounded hover:bg-gray-50">
                                Reset
                            </button>
                        </div>
                    </section>
                </form>
            </div>
        </div>
    );
};
