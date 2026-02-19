import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { AuthContext } from '@/contexts/auth-context';

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<'admin' | 'user' | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRole = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching role:', error);
                return;
            }
            if (data) {
                setRole(data.role as 'admin' | 'user');
            }
        } catch (err) {
            console.error('Error fetching role failed:', err);
        }
    };

    useEffect(() => {
        // Get initial session
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchRole(session.user.id);
            }
            setIsLoading(false);
        };
        initSession();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                setIsLoading(true);
                await fetchRole(session.user.id);
                setIsLoading(false);
            } else {
                setRole(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            setError(null);
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;
        } catch (err) {
            console.error('Error signing in:', err);
            setError('Failed to sign in');
            throw err;
        }
    };

    const signInWithGoogle = async () => {
        try {
            setError(null);
            const { error: signInError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: `${window.location.origin}/`,
                },
            });
            if (signInError) throw signInError;
        } catch (err: any) {
            console.error('Error signing in with Google:', err);
            setError(err.message || 'Failed to sign in with Google');
            throw err;
        }
    };

    const signOut = async () => {
        try {
            setError(null);
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) throw signOutError;
            setRole(null);
        } catch (err) {
            console.error('Error signing out:', err);
            setError('Failed to sign out');
            throw err;
        }
    };

    const value = {
        user,
        role,
        isAdmin: role === 'admin',
        isLoading,
        error,
        signIn,
        signInWithGoogle,
        signOut,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
