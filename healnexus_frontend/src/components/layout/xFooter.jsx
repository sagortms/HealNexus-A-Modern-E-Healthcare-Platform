import { HeartPulse, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-[#020817] text-slate-400 py-12 relative border-t border-slate-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">

            {/* Subtle glowing separator line for Modern Theme separation */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-900/60 to-transparent"></div>

            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">

                {/* Brand */}
                <div className="space-y-4">
                    <div className="flex items-center cursor-pointer">
                        <HeartPulse className="w-8 h-8 text-blue-500 mr-2" />
                        <span className="text-2xl font-bold tracking-tight text-slate-100">HealNexus</span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Revolutionizing healthcare in Bangladesh by connecting patients with top-tier doctors through smart, seamless technology.
                    </p>
                </div>

                {/* Quick Links */}
                <div>
                    <h4 className="text-slate-200 font-semibold mb-4">Quick Links</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/" className="hover:text-blue-400 transition-colors">Home</Link></li>
                        <li><a href="#about" className="hover:text-blue-400 transition-colors">About Us</a></li>
                        <li><a href="#services" className="hover:text-blue-400 transition-colors">Services</a></li>
                        <li><Link to="/register" className="hover:text-blue-400 transition-colors">Create Account</Link></li>
                    </ul>
                </div>

                {/* Services */}
                <div>
                    <h4 className="text-slate-200 font-semibold mb-4">Services</h4>
                    <ul className="space-y-2 text-sm">
                        <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Virtual Consultations</span></li>
                        <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Smart Scheduling</span></li>
                        <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Medical Records</span></li>
                        <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Prescription Management</span></li>
                    </ul>
                </div>

                {/* Contact */}
                <div>
                    <h4 className="text-slate-200 font-semibold mb-4">Contact Us</h4>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-start"><MapPin className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" /> Banani, Dhaka 1213, Bangladesh</li>
                        <li className="flex items-center"><Phone className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" /> 16263 (Helpline)</li>
                        <li className="flex items-center"><Mail className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" /> support@healnexus.com.bd</li>
                    </ul>
                </div>

            </div>

            <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800/50 text-sm text-center text-slate-600 relative z-10">
                &copy; {new Date().getFullYear()} HealNexus Bangladesh. All rights reserved.
            </div>
        </footer>
    );
}