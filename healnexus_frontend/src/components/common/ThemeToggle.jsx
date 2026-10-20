import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const isModern = theme === 'dark';

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <div className="flex items-center bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full p-1.5 border border-white/20 shadow-2xl">
                <button 
                    onClick={() => setTheme('light')} 
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${!isModern ? 'bg-white text-slate-900 shadow-md scale-105' : 'text-slate-400 hover:text-white'}`}
                >
                    Normal
                </button>
                <button 
                    onClick={() => setTheme('dark')} 
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${isModern ? 'bg-blue-600 text-white shadow-md scale-105' : 'text-slate-400 hover:text-white'}`}
                >
                    Modern
                </button>
            </div>
        </div>
    );
}
