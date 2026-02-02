import type { FC, Props } from '@/velocity';
import { authActions, isAuthenticated, userName } from '@/app/stores/auth';
import { addActivity } from '@/app/stores/app';

export const Header: FC<Props & { Link: any }> = ({ Link }) => (
    <header class="topbar">
        <div class="brand">Secure Reactive Suite</div>
        <nav class="nav">
            <Link to="/" class="nav-link" activeClass="active">Home</Link>
            <Link to="/dashboard" class="nav-link" activeClass="active">Dashboard</Link>
            <Link to="/settings" class="nav-link" activeClass="active">Settings</Link>
            <Link to="/analytics" class="nav-link" activeClass="active">Analytics</Link>
            <Link to="/profile/ava" class="nav-link" activeClass="active">Profile</Link>
        </nav>
        <div class="session">
            <span class="pill">{userName}</span>
            <button
                class="button small"
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
    </header>
);
