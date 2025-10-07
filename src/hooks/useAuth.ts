import { useState, useEffect } from 'react';

// Assuming AuthPayload is defined in a types file, e.g., @/lib/types
interface AuthPayload {
    token: string;
    siteUrl: string;
    userId?: number;
    username: string;
}

export function useAuth() {
    const [auth, setAuth] = useState<{ isLoggedIn: boolean; username: string; token: string | null; siteUrl: string | null }>({
        isLoggedIn: false,
        username: '',
        token: null,
        siteUrl: null,
    });
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [loginError, setLoginError] = useState('');

    useEffect(() => {
        try {
            const storedAuth = localStorage.getItem('providerAuth');
            if (storedAuth) {
                const parsedAuth: AuthPayload = JSON.parse(storedAuth);
                setAuth({
                    isLoggedIn: true,
                    username: parsedAuth.username,
                    token: parsedAuth.token,
                    siteUrl: parsedAuth.siteUrl,
                });
            }
        } catch (error) {
            console.error("Failed to parse auth data from localStorage", error);
            localStorage.removeItem('providerAuth');
        } finally {
            setIsAuthLoading(false);
        }
    }, []);

    const login = async (usernameInput: string, passwordInput: string) => {
        setLoginError('');
        try {
            const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
            const response = await fetch(`${apiUrl}/wp-json/jwt-auth/v1/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usernameInput, password: passwordInput }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Invalid credentials.');
            }

            const tokenData = await response.json();
            const authPayload: AuthPayload = {
                username: tokenData.user_display_name,
                siteUrl: apiUrl || '',
                token: tokenData.token,
            };
            
            localStorage.setItem('providerAuth', JSON.stringify(authPayload));
            setAuth({
                isLoggedIn: true,
                username: authPayload.username,
                token: authPayload.token,
                siteUrl: authPayload.siteUrl,
            });
            return true; // Indicate success
        } catch (error) {
            setLoginError(error instanceof Error ? error.message : String(error));
            return false; // Indicate failure
        }
    };

    const logout = () => {
        localStorage.removeItem('providerAuth');
        localStorage.removeItem('cachedBookings');
        localStorage.removeItem('cachedEnquiries');
        setAuth({ isLoggedIn: false, username: '', token: null, siteUrl: null });
    };

    return { auth, login, logout, isAuthLoading, loginError, setLoginError };
}
