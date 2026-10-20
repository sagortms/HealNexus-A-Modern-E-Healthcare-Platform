import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, FileText, Activity, Users, Settings } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

export default function Sidebar() {
    const location = useLocation();
    const token = localStorage.getItem('token');

    // Safely decode the token to get the user's role
    let role = '';
    if (token) {
        try { role = jwtDecode(token).role; } catch (e) { console.error("Invalid token"); }
    }

    // Define menu items based on the user's role
    const menus = {
        patient: [
            { name: 'Dashboard', path: '/patient', icon: Home },
            { name: 'My Appointments', path: '/patient/appointments', icon: Calendar },
            { name: 'Medical Records', path: '/patient/records', icon: FileText },
        ],
        doctor: [
            { name: 'Dashboard', path: '/doctor', icon: Home },
            { name: 'My Schedule', path: '/doctor/schedule', icon: Calendar },
            { name: 'My Patients', path: '/doctor/patients', icon: Users },
        ],
        admin: [
            { name: 'Dashboard', path: '/admin', icon: Home },
            { name: 'All Users', path: '/admin/users', icon: Users },
            { name: 'System Activity', path: '/admin/activity', icon: Activity },
        ]
    };

    const currentMenu = menus[role] || [];

    return (
        <div className="w-64 bg-white dark:bg-[#020817] border-r border-slate-200 dark:border-slate-800 min-h-screen flex flex-col transition-colors duration-500">
            <div className="p-6">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Menu</p>
                <nav className="space-y-1.5">
                    {currentMenu.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${isActive
                                        ? 'bg-primary text-white shadow-md shadow-blue-500/20'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary dark:hover:text-blue-400'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}