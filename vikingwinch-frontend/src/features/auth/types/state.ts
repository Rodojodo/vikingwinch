import type {UserProfile} from './domain';

export interface AuthState {
    isAuthenticated: boolean;
    user: UserProfile | null;
    token: string | null;
    error: string | null;
}
