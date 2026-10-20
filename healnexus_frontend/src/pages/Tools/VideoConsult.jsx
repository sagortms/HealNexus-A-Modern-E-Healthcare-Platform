import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video, ArrowLeft, Calendar, Clock, User, ShieldCheck, ArrowRight, VideoOff, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function VideoConsult() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            fetchAppointments();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/patient/dashboard');
            // Filter only scheduled appointments
            const scheduled = res.data.appointments.filter(a => a.status === 'Scheduled');
            setAppointments(scheduled);
        } catch (err) {
            console.error("Failed to fetch appointments");
        } finally {
            setLoading(false);
        }
    };

    // --- VIEW 1: FOR LOGGED OUT USERS (Marketing/Prompt) ---
    if (!isLoggedIn && !loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#020817] py-12 px-4 sm:px-6 transition-colors duration-500">
                <div className="max-w-4xl mx-auto">
                    <Link to="/" className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                    </Link>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden transition-colors">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-50"></div>

                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner transition-colors">
                                <Video className="w-10 h-10" />
                            </div>
                            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight transition-colors">Virtual Consultations</h1>
                            <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed transition-colors">
                                Connect with top-rated specialists across Bangladesh from the comfort of your home. Secure, private, and fully integrated with your medical records.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link to="/login" className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center">
                                    Log In to Join Call
                                </Link>
                                <Link to="/doctors" className="w-full sm:w-auto px-8 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                    Find a Doctor
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020817]"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

    // --- VIEW 2: FOR LOGGED IN PATIENTS (The Dashboard) ---
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020817] py-12 px-4 sm:px-6 transition-colors duration-500">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link
                        to={localStorage.getItem('role') === 'patient' ? '/patient' : localStorage.getItem('role') === 'doctor' ? '/doctor' : '/'}
                        className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Link>
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-full flex items-center transition-colors">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Secure Connection
                    </span>
                </div>

                <div className="flex items-center mb-8">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl mr-4 shadow-sm shrink-0 transition-colors">
                        <Video className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">Your Video Consultations</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 transition-colors">Join your scheduled telehealth appointments here.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {appointments.length > 0 ? (
                        appointments.map((apt) => {
                            const aptDate = new Date(apt.date_time);
                            return (
                                <div key={apt.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between transition-all hover:shadow-md">
                                    <div className="mb-6 md:mb-0">
                                        <div className="flex items-center mb-2">
                                            <div className={`w-2 h-2 rounded-full mr-2 bg-emerald-500 animate-pulse`}></div>
                                            <span className={`text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400`}>
                                                {apt.status}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">Dr. {apt.doctor_name}</h3>
                                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 transition-colors">{apt.reason}</p>

                                        <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 inline-flex px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 transition-colors">
                                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5 text-slate-400 dark:text-slate-500" /> {aptDate.toLocaleDateString()}</span>
                                            <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5 text-slate-400 dark:text-slate-500" /> {aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>

                                    <div>
                                        {apt.meet_link ? (
                                            <a
                                                href={apt.meet_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all relative overflow-hidden group"
                                            >
                                                <Video className="w-5 h-5 mr-2" /> Join Video Room
                                            </a>
                                        ) : (
                                            <button disabled className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold rounded-xl cursor-not-allowed border border-slate-200 dark:border-slate-700 transition-colors">
                                                <VideoOff className="w-5 h-5 mr-2" /> Link not ready
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
                            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg transition-colors">No upcoming video consultations found.</p>
                            <Link to="/doctors" className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                                Book an appointment <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
