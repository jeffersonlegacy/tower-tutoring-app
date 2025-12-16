import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            console.error("AuthContext: No auth instance found.");
            setLoading(false);
            return;
        }

        // 1. Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                setLoading(false);
            } else {
                if (!auth) return;
                // 2. Auto-sign in anonymously if not authenticated
                signInAnonymously(auth).catch((error) => {
                    console.error("Auth Error:", error);
                    setLoading(false);
                });
            }
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
