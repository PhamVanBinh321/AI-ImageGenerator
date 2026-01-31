import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import client, { setAuthToken } from '../api/client';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                setAuthToken(token);
                try {
                    // We need to fetch the user profile here to ensure token is valid
                    // Assuming there's an endpoint /auth/user or similar.
                    // For now, we rely on the backend to validate or we try to fetch profile.
                    // Ideally, we make a request to /auth/user
                    const res = await client.get('/auth/user') as unknown as User; // Cast properly later
                    setUser(res);
                } catch (error) {
                    console.error("Auth check failed:", error);
                    localStorage.removeItem('token');
                    setAuthToken(null);
                }
            }
            setIsLoading(false);
        };

        loadUser();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        setAuthToken(token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setAuthToken(null);
        setUser(null);
    };

    const updateUser = (userData: User) => {
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
