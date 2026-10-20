import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Bell, Check, ExternalLink, X, Clock } from 'lucide-react';
import api from '../../services/api';
import AnimatedLogo from '../common/AnimatedLogo';

export default function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // Notifications State
    const [notifs, setNotifs] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const res = await api.get('/notifications/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifs(res.data);
            setUnreadCount(res.data.filter(n => !n.is_read).length);
        } catch (err) { console.error("Failed to load notifications."); }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [token]);

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(0);
            setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) { }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <header className="h-16 bg-white dark:bg-[#020817] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50 transition-all duration-500">
            <AnimatedLogo />

            <div className="flex items-center space-x-2 md:space-x-4">
                {/* Notification Bell (Only for logged in users) */}
                {token && (
                    <div className="relative">
                        <button 
                            onClick={() => setShowNotifs(!showNotifs)}
                            className={`p-2 rounded-full transition-all relative ${showNotifs ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-bounce">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifs && (
                            <div className="absolute top-full right-0 mt-3 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-top-2 z-[60]">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Alert Center</h4>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllRead} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">Mark all read</button>
                                    )}
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                                    {notifs.length > 0 ? notifs.map(n => (
                                        <div key={n.id} className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!n.is_read ? 'bg-blue-50/20 dark:bg-blue-900/5' : ''}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <p className={`text-sm font-bold ${!n.is_read ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{n.title}</p>
                                                <p className="text-[9px] text-slate-400 flex items-center font-bold uppercase"><Clock className="w-2.5 h-2.5 mr-1" /> {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{n.message}</p>
                                        </div>
                                    )) : (
                                        <div className="p-10 text-center text-slate-400 italic text-sm">No new notifications.</div>
                                    )}
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 text-center border-t border-slate-100 dark:border-slate-800">
                                    <button onClick={() => setShowNotifs(false)} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Close Panel</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
                    {token ? 'U' : 'G'}
                </div>

                <button
                    onClick={handleLogout}
                    className="hidden sm:flex items-center px-4 py-2 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                </button>
            </div>
        </header>
    );
}