import { Link, type FC, type Props } from '@/core/velocity';
import { authActions, isAuthenticated, userName } from '@/app/stores/auth';
import { addActivity } from '@/app/stores/app';

export const Header: FC = () => (
    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex items-center justify-between max-w-7xl mx-auto">
            <div class="flex items-center space-x-8">
                <h1 class="text-xl font-bold text-gray-900 dark:text-white">Secure Reactive Suite</h1>
                <nav class="hidden md:flex space-x-6">
                    <Link to="/" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors" activeClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">Home</Link>
                    <Link to="/dashboard" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors" activeClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">Dashboard</Link>
                    <Link to="/settings" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors" activeClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">Settings</Link>
                    <Link to="/analytics" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors" activeClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">Analytics</Link>
                    <Link to="/profile/ava" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors" activeClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">Profile</Link>
                </nav>
            </div>
            <div class="flex items-center space-x-4">
                <span class="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">{userName}</span>
                <button
                    class="border-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    onClick={() => {
                        if (isAuthenticated()) {
                            authActions.logout();
                            addActivity('Signed out');
                        } else {
                            addActivity('Navigate to sign in');
                        }
                    }}
                >
                    {() => isAuthenticated() ? 'Sign Out' : 'Guest Mode'}
                </button>
            </div>
        </div>
    </header>
);
