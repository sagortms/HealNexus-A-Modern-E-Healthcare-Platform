import { Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedLogo from '../common/AnimatedLogo';

export default function Footer() {
    // Check if the user is currently logged in
    const isLoggedIn = !!localStorage.getItem('token');

    // If logged in, do not render the footer at all
    if (isLoggedIn) {
        return null;
    }

    return (
        <footer className="bg-slate-50 dark:bg-[#020817] text-slate-600 dark:text-slate-400 py-12 relative border-t border-slate-200 dark:border-slate-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)] transition-colors duration-500">

            {/* Subtle glowing separator line for Modern Theme separation */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-900/60 dark:via-blue-400/20 to-transparent"></div>

            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">

                {/* Brand */}
                <div className="space-y-4">
                    <div className="flex items-center cursor-pointer">
                        <AnimatedLogo />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        Revolutionizing healthcare in Bangladesh by connecting patients with top-tier doctors through smart, seamless technology.
                    </p>
                </div>

                {/* Quick Links */}
                <div>
                    <h4 className="text-slate-900 dark:text-slate-200 font-semibold mb-4">Quick Links</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link></li>
                        <li><Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About Us</Link></li>
                        <li><Link to="/services" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Services</Link></li>
                        <li><Link to="/register" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Create Account</Link></li>
                    </ul>
                </div>

                {/* Services */}
                <div>
                    <h4 className="text-slate-900 dark:text-slate-200 font-semibold mb-4">Services</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/video-consult" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Virtual Consultations</Link></li>
                        <li><Link to="/doctors" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Smart Scheduling</Link></li>
                        <li><Link to="/patient" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Medical Records</Link></li>
                        <li><Link to="/pill-directory" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Prescription Management</Link></li>
                    </ul>
                </div>

                {/* Contact */}
                <div>
                    <h4 className="text-slate-900 dark:text-slate-200 font-semibold mb-4">Contact Us</h4>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-start"><MapPin className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" /> Banani, Dhaka 1213, Bangladesh</li>
                        <li className="flex items-center"><Phone className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0" /> 16263 (Helpline)</li>
                        <li className="flex items-center"><Mail className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0" /> support@healnexus.com.bd</li>
                    </ul>
                </div>

            </div>

            <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/50 text-sm text-center text-slate-500 dark:text-slate-600 relative z-10">
                &copy; {new Date().getFullYear()} HealNexus Bangladesh. All rights reserved.
            </div>
        </footer>
    );
}