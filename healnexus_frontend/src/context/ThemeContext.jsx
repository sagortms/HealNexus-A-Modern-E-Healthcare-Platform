import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        
        // Sync to backend if logged in
        const token = localStorage.getItem('token');
        if (token) {
            try {
                await api.put(`/auth/theme?theme=${newTheme}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) { console.error("Failed to sync theme to account."); }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
