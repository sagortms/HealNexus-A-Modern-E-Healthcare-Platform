import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search, ArrowRight, ShieldCheck, Calendar, FileText,
    Video, Phone, Star, MapPin, Sliders, Menu, X,
    User, Stethoscope, Shield, ChevronRight, Activity, PlusCircle, CheckCircle, LogOut, LayoutDashboard, ChevronDown
} from 'lucide-react';
import Footer from '../components/layout/Footer';
import AnimatedLogo from '../components/common/AnimatedLogo';
import { useTheme } from '../context/ThemeContext';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export default function Home() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [department, setDepartment] = useState('');
    const [rating, setRating] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [user, setUser] = useState(null); // Add missing user state

// DEBOUNCE LOGIC
useEffect(() => {
    const handler = setTimeout(() => {
        setDebouncedQuery(searchQuery);
    }, 500); // 500ms delay
    return () => clearTimeout(handler);
}, [searchQuery]);

useEffect(() => {
    // If debouncedQuery changes, we could trigger a live list here
    // but for this UI, we still have the explicit Search button.
    // Let's keep it as is or navigate automatically?
    // User asked for "Debouncing" to prevent excessive calls.
}, [debouncedQuery]);

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [dashboardData, setDashboardData] = useState({ available_doctors: [] });
    const [popularDoctors, setPopularDoctors] = useState([]);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingForm, setBookingForm] = useState({ doctor_id: '', reason: '', file: null });
    const [successMsg, setSuccessMsg] = useState('');

    const isModern = theme === 'dark';

    useEffect(() => {
        // Fetch all doctors for the homepage display
        api.get('/medical/doctors')
            .then(res => setPopularDoctors(res.data.slice(0, 4)))
            .catch(() => console.error("Failed to fetch popular doctors"));

        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setUser(decoded);

                // REDIRECT DOCTORS TO THEIR DEDICATED HOME
                if (decoded.role?.toLowerCase() === 'doctor') {
                    navigate('/doctor');
                }
                
                // Fetch doctors if patient
                if (decoded.role === 'patient') {
                    api.get('/patient/dashboard', { headers: { Authorization: `Bearer ${token}` } })
                        .then(res => setDashboardData(res.data))
                        .catch(() => console.error("Failed to load dashboard data"));
                }
            } catch {
                localStorage.removeItem('token');
            }
        }
    }, [navigate]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setUser(null);
        navigate('/');
    };

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('doctor_id', bookingForm.doctor_id);
        formData.append('reason', bookingForm.reason);
        if (bookingForm.file) formData.append('file', bookingForm.file);

        try {
            await api.post('/patient/appointments', formData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            setIsBookingModalOpen(false);
            setSuccessMsg("Request sent! Wait for doctor to set time.");
            setBookingForm({ doctor_id: '', reason: '', file: null });
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch { alert("Failed to book appointment."); }
    };

    // Dynamic Theme Classes
    const bgBase = isModern ? 'bg-[#020817]' : 'bg-white';
    const textBase = isModern ? 'text-slate-100' : 'text-slate-900';
    const textMuted = isModern ? 'text-slate-400' : 'text-slate-500';
    const bgCard = isModern ? 'bg-[#0f172a]' : 'bg-slate-50';
    const borderColor = isModern ? 'border-slate-800' : 'border-slate-200';
    const navbarBg = isModern ? 'bg-[#020817]/90' : 'bg-white/90';

    // Search Function
    const handleSearch = (e) => {
        if (e) e.preventDefault();
        const params = new URLSearchParams();
        if (searchQuery) params.append('query', searchQuery);
        if (department) params.append('department', department);
        if (rating) params.append('rating', rating);
        navigate(`/doctors?${params.toString()}`);
        setShowFilters(false);
    };

    const features = [
        { id: 'scheduling', title: 'Smart Scheduling', icon: Calendar, colorClass: 'text-blue-500', bgClass: 'bg-blue-500/10', summary: 'Book appointments with top specialists instantly. Skip the waiting room.', link: '/doctors' },
        { id: 'records', title: 'Centralized Records', icon: FileText, colorClass: 'text-purple-500', bgClass: 'bg-purple-500/10', summary: 'Access your entire medical history, labs, and notes in one secure vault.', link: '/patient' },
        { id: 'video', title: 'Video Consultations', icon: Video, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10', summary: 'Connect with healthcare professionals securely from the comfort of home.', link: '/video-consult' },
        { id: 'prescription', title: 'Common Prescriptions', icon: FileText, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10', summary: 'Standard OTC medical guidelines and remedies for minor ailments.', link: '/common-prescriptions' },
        { id: 'pills', title: 'Pill Directory & Dosage', icon: PlusCircle, colorClass: 'text-cyan-500', bgClass: 'bg-cyan-500/10', summary: 'Quick reference guide for common medications and age-based dosages.', link: '/pill-directory' }
    ];

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 ${bgBase} ${textBase}`}>
            <div className={`${isModern ? 'bg-blue-950 text-blue-200' : 'bg-slate-900 text-slate-300'} py-2 px-6 text-xs font-medium flex justify-center items-center transition-colors duration-500`}>
                <div className="flex items-center space-x-6">
                    <span className="flex items-center"><Phone className="w-3 h-3 mr-1.5 text-emerald-400" /> National Helpline: 16263</span>
                    <span className="flex items-center hidden md:flex"><ShieldCheck className="w-3 h-3 mr-1.5 text-emerald-400" /> Verified BD Medical Council Doctors</span>
                </div>
            </div>

            <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${borderColor} ${navbarBg} transition-all shadow-sm`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center cursor-pointer mr-6">
                        <AnimatedLogo />
                    </div>

                    <div className="hidden md:flex flex-1 max-w-3xl relative mr-6">
                        <form onSubmit={handleSearch} className={`w-full flex items-center ${bgCard} border ${borderColor} rounded-full px-2 py-1.5 shadow-inner transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent`}>
                            <div className="flex items-center flex-1 px-3">
                                <Search className={`w-4 h-4 ${textMuted} mr-2 flex-shrink-0`} />
                                <input type="text" placeholder="Search specialties, doctors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full bg-transparent border-none outline-none text-sm placeholder-${isModern ? 'slate-500' : 'slate-400'}`} />
                            </div>
                            <div className={`h-5 w-px ${isModern ? 'bg-slate-700' : 'bg-slate-300'} mx-1`}></div>
                            <button type="button" onClick={() => setShowFilters(!showFilters)} className={`flex items-center px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${showFilters ? 'bg-blue-100 text-blue-700' : `${textMuted} hover:text-blue-500`}`}>
                                <Sliders className="w-4 h-4 mr-1.5" /> Filter
                            </button>
                            <button type="submit" className="bg-blue-600 text-white rounded-full p-2 ml-1 hover:bg-blue-700 transition-colors shadow-sm"><ArrowRight className="w-4 h-4" /></button>
                        </form>

                        {showFilters && (
                            <div className={`absolute top-full right-0 mt-3 w-72 ${bgBase} border ${borderColor} rounded-2xl shadow-xl p-5 z-50`}>
                                <h4 className={`font-semibold mb-4 border-b pb-2 ${borderColor}`}>Refine Search</h4>
                                <div className="mb-4">
                                    <label className={`block text-xs font-medium ${textMuted} mb-1.5 flex items-center`}><Stethoscope className="w-3.5 h-3.5 mr-1" /> Select Department</label>
                                    <select value={department} onChange={(e) => setDepartment(e.target.value)} className={`w-full ${bgCard} border ${borderColor} rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer dark:text-white`}>
                                        <option value="">All Departments</option>
                                        <option value="Cardiology">Cardiology</option>
                                        <option value="Neurology">Neurology</option>
                                        <option value="Pediatrics">Pediatrics</option>
                                        <option value="Dermatology">Dermatology</option>
                                        <option value="Orthopedics">Orthopedics</option>
                                    </select>
                                </div>
                                <div className="mb-6">
                                    <label className={`block text-xs font-medium ${textMuted} mb-1.5 flex items-center`}><Star className="w-3.5 h-3.5 mr-1" /> Minimum Rating</label>
                                    <select value={rating} onChange={(e) => setRating(e.target.value)} className={`w-full ${bgCard} border ${borderColor} rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer dark:text-white`}>
                                        <option value="">Any Rating</option>
                                        <option value="5">5 Stars Only</option>
                                        <option value="4">4 Stars & Above</option>
                                        <option value="3">3 Stars & Above</option>
                                    </select>
                                </div>
                                <button onClick={handleSearch} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">Apply Filters</button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-4 flex-shrink-0">
                        <div className="hidden sm:flex items-center space-x-4">
                            {user ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button onClick={() => setIsProfileOpen(!isProfileOpen)} className={`flex items-center space-x-2 p-1 rounded-full border ${borderColor} ${bgCard} hover:border-blue-500 transition-all focus:ring-2 focus:ring-blue-500/20`}>
                                        <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-primary dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800 uppercase text-xs">{user.sub ? user.sub.charAt(0) : 'U'}</div>
                                        <ChevronDown className={`w-4 h-4 ${textMuted} transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isProfileOpen && (
                                        <div className={`absolute top-full right-0 mt-3 w-64 ${bgBase} border ${borderColor} rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}>
                                            <div className={`p-4 border-b ${borderColor} bg-slate-50 dark:bg-slate-900/50`}><p className={`text-sm font-bold ${textBase} truncate`}>{user.sub}</p><p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">{user.role}</p></div>
                                            <div className="p-2">
                                                <Link to={`/${user.role?.toLowerCase()}`} onClick={() => setIsProfileOpen(false)} className={`w-full flex items-center px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors ${textBase}`}><LayoutDashboard className="w-4 h-4 mr-3 opacity-70" /> My Dashboard</Link>
                                                <button onClick={() => { handleLogout(); setIsProfileOpen(false); }} className="w-full flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"><LogOut className="w-4 h-4 mr-3 opacity-70" /> Logout</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Link to="/login" className={`text-sm font-semibold hover:text-blue-600 transition-colors ${isModern ? 'text-slate-300' : 'text-slate-700'}`}>Log In</Link>
                                    <Link to="/register" className="text-sm font-semibold text-white bg-blue-600 px-5 py-2.5 rounded-full hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">Sign Up Free</Link>
                                </>
                            )}
                        </div>
                        <button onClick={() => setIsMenuOpen(true)} className={`p-2 rounded-full border ${borderColor} ${bgCard} hover:bg-blue-50 transition-colors`}><Menu className={`w-5 h-5 ${textBase}`} /></button>
                    </div>
                </div>
            </header>

            {isMenuOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)}></div>
                    <div className={`relative w-80 h-full shadow-2xl flex flex-col ${bgBase} border-l ${borderColor} animate-in slide-in-from-right duration-300`}>
                        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}><div className="flex items-center"><AnimatedLogo /></div><button onClick={() => setIsMenuOpen(false)} className={`p-2 rounded-full ${bgCard} hover:text-red-500 transition-colors`}><X className="w-5 h-5" /></button></div>
                        <div className="p-6 flex-1 overflow-y-auto space-y-8">
                            <div>
                                <h4 className={`text-xs font-bold uppercase tracking-wider ${textMuted} mb-3`}>Account Access</h4>
                                <div className="space-y-2">
                                    {user ? (
                                        <>
                                            <Link to={`/${user.role?.toLowerCase()}`} className={`flex items-center px-4 py-3 rounded-xl ${bgCard} hover:bg-blue-600 hover:text-white transition-all group`} onClick={() => setIsMenuOpen(false)}><LayoutDashboard className="w-5 h-5 mr-3 text-emerald-500 group-hover:text-white" /><span className="font-medium text-sm">My Dashboard</span></Link>
                                            <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl ${bgCard} hover:bg-rose-500 hover:text-white transition-all group`}><LogOut className="w-5 h-5 mr-3 text-rose-500 group-hover:text-white" /><span className="font-medium text-sm">Logout</span></button>
                                        </>
                                    ) : (
                                        <>
                                            <Link to="/login" className={`flex items-center px-4 py-3 rounded-xl ${bgCard} hover:bg-blue-600 hover:text-white transition-all group`} onClick={() => setIsMenuOpen(false)}><User className="w-5 h-5 mr-3 text-blue-500 group-hover:text-white" /><span className="font-medium text-sm">Log In</span></Link>
                                            <Link to="/register" className={`flex items-center px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all group shadow-md`} onClick={() => setIsMenuOpen(false)}><Shield className="w-5 h-5 mr-3" /><span className="font-medium text-sm">Sign Up Free</span></Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <main className="relative overflow-hidden">
                <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none transition-colors duration-700 ${isModern ? 'bg-blue-600' : 'bg-blue-200'}`}></div>
                <div className={`absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none transition-colors duration-700 ${isModern ? 'bg-emerald-600' : 'bg-emerald-100'}`}></div>
                <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8">
                        <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.15] tracking-tight">Find the right doctor. <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-400">Book instantly.</span></h1>
                        <p className={`text-lg max-w-lg leading-relaxed ${textMuted}`}>Take control of your healthcare in Bangladesh. Search top-rated specialists in Dhaka, Chittagong, and beyond. Book virtual or in-person visits seamlessly.</p>
                        <Link to="/doctors" className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all">Browse Top Doctors <ArrowRight className="w-5 h-5 ml-2" /></Link>
                    </div>
                    <div className="relative"><img src="https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=800" alt="Doctor" className={`rounded-3xl shadow-2xl border-4 ${isModern ? 'border-slate-800 shadow-blue-900/20' : 'border-white'}`} /></div>
                </div>
            </main>

            <section className={`py-20 border-y ${borderColor} ${isModern ? 'bg-[#0a0f1c]' : 'bg-slate-50'} transition-colors duration-500`}>
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
                        <div><h2 className="text-3xl font-bold mb-3">Top Rated Specialists</h2><p className={textMuted}>Highly recommended by patients across Bangladesh.</p></div>
                        <Link to="/doctors" className={`hidden md:flex items-center text-sm font-semibold mt-4 md:mt-0 ${isModern ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>View all doctors <ArrowRight className="w-4 h-4 ml-1" /></Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {popularDoctors.map((doc) => (
                            <div key={doc.id} className={`p-5 rounded-2xl border ${borderColor} ${bgBase} hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group`}>
                                <div className="flex items-center space-x-4 mb-4"><img src={doc.image} alt={doc.name} className={`w-14 h-14 rounded-full object-cover border-2 ${isModern ? 'border-slate-700' : 'border-blue-100'}`} /><div><h3 className="font-bold text-sm">{doc.name}</h3><p className={`text-xs font-medium mt-0.5 ${isModern ? 'text-blue-400' : 'text-blue-600'}`}>{doc.specialty}</p></div></div>
                                <div className={`flex items-center justify-between text-xs mb-5 ${textMuted}`}><div className="flex items-center text-amber-400"><Star className="w-3.5 h-3.5 fill-current mr-1" /><span className={`font-bold ${textBase}`}>{doc.rating}</span></div><span>{doc.reviews} Reviews</span></div>
                                <div className="space-y-2">
                                    <button onClick={() => { if (user?.role?.toLowerCase() === 'patient') { setIsBookingModalOpen(true); } else if (user) { navigate(`/${user.role?.toLowerCase()}`); } else { navigate('/login'); } }} className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold transition-colors bg-blue-600 text-white hover:bg-blue-700 shadow-md"><Calendar className="w-4 h-4 mr-2" /> Book Appointment</button>
                                    <Link to={`/doctors?query=${doc.specialty}`} className={`w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isModern ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>View {doc.specialty} Dept <ChevronRight className="w-4 h-4 ml-1" /></Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="services" className={`py-24 ${isModern ? 'bg-[#0f172a]' : 'bg-white'}`}>
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16"><h2 className="text-3xl font-bold mb-4">Empowering Your Health Decisions</h2><p className={textMuted}>From booking top specialists to instant self-service medical guides, HealNexus puts you entirely in control.</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <Link key={feature.id} to={feature.link} className={`group block p-8 rounded-3xl border ${borderColor} ${bgBase} hover:-translate-y-1 hover:shadow-xl hover:border-blue-400 transition-all duration-300`}>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${feature.bgClass} ${feature.colorClass}`}><Icon className="w-7 h-7" /></div>
                                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                    <p className={`${textMuted} leading-relaxed mb-6 text-sm`}>{feature.summary}</p>
                                    <div className={`flex items-center text-sm font-semibold ${isModern ? 'text-blue-400' : 'text-blue-600'}`}>Try it out <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" /></div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {isBookingModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in transition-all">
                    <div className={`${bgBase} rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative border ${borderColor} transition-colors`}>
                        <button onClick={() => setIsBookingModalOpen(false)} className={`absolute top-4 right-4 p-2 ${textMuted} hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors`}><X className="w-6 h-6" /></button>
                        <h2 className="text-2xl font-bold mb-2">Book Appointment</h2>
                        <form onSubmit={handleBookAppointment} className="space-y-4 mt-6">
                            <div><label className={`block text-sm font-bold ${textBase} mb-1`}>Select Doctor</label><select required value={bookingForm.doctor_id} onChange={(e) => setBookingForm({ ...bookingForm, doctor_id: e.target.value })} className={`w-full p-3 ${bgCard} border ${borderColor} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none`}><option value="">-- Choose a Doctor --</option>{dashboardData.available_doctors.map(doc => (<option key={doc.id} value={doc.id}>Dr. {doc.name} ({doc.specialty || 'General'})</option>))}</select></div>
                            <div><label className={`block text-sm font-bold ${textBase} mb-1`}>Reason for visit</label><input required type="text" placeholder="e.g., Routine Checkup, Chest Pain" value={bookingForm.reason} onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })} className={`w-full p-3 ${bgCard} border ${borderColor} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none`} /></div>
                            <div><label className={`block text-sm font-bold ${textBase} mb-1`}>Attach Document (Optional)</label><input type="file" onChange={(e) => setBookingForm({ ...bookingForm, file: e.target.files[0] })} className={`w-full p-2 ${bgCard} border ${borderColor} rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50`} /></div>
                            <button type="submit" className="w-full py-3.5 mt-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-colors">Confirm Booking</button>
                        </form>
                    </div>
                </div>
            )}

            {successMsg && <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 font-bold flex items-center shadow-lg animate-in fade-in slide-in-from-bottom-5"><CheckCircle className="w-5 h-5 mr-2" /> {successMsg}</div>}
            <Footer />
        </div>
    );
}
