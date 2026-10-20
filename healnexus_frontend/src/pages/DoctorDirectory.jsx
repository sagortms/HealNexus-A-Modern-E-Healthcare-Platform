import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, Search, CalendarPlus, Award, Clock,
    HeartPulse, Phone, ChevronLeft, X, CheckCircle
} from 'lucide-react';
import Footer from '../components/layout/Footer';
import AnimatedLogo from '../components/common/AnimatedLogo';
import { useTheme } from '../context/ThemeContext';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export default function DoctorDirectory() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [doctorsList, setDoctorsList] = useState([]);
    const [groupedDoctors, setGroupedDoctors] = useState({});
    const [totalFiltered, setTotalFiltered] = useState(0);

    const { theme } = useTheme();
    const isModern = theme === 'dark';

    // Profile & Booking States
    const [user, setUser] = useState(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingForm, setBookingForm] = useState({ doctor_id: '', reason: '', file: null });
    const [successMsg, setSuccessMsg] = useState('');

    // Dynamic Theme Classes
    const bgBase = isModern ? 'bg-[#020817]' : 'bg-slate-50';
    const textBase = isModern ? 'text-slate-100' : 'text-slate-900';
    const textMuted = isModern ? 'text-slate-400' : 'text-slate-500';
    const bgCard = isModern ? 'bg-[#0f172a]' : 'bg-white';
    const borderColor = isModern ? 'border-slate-800' : 'border-slate-200';
    const navbarBg = isModern ? 'bg-[#020817]/90' : 'bg-white/90';

    // Read URL Parameters
    const queryParam = searchParams.get('query') || '';
    const areaParam = searchParams.get('area') || '';
    const ratingParam = searchParams.get('rating') || '';

    useEffect(() => {
        // Fetch all doctors from backend
        api.get('/medical/doctors')
            .then(res => setDoctorsList(res.data))
            .catch(() => console.error("Failed to fetch doctors"));

        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setUser(decoded);
            } catch {
                localStorage.removeItem('token');
            }
        }
    }, []);

    // Filter & Group Logic
    useEffect(() => {
        let filtered = doctorsList;

        // 1. Filter by Search Query
        if (queryParam) {
            const lowerQuery = queryParam.toLowerCase();
            filtered = filtered.filter(doc =>
                doc.name.toLowerCase().includes(lowerQuery) ||
                doc.specialty.toLowerCase().includes(lowerQuery)
            );
        }

        // 2. Filter by Area
        if (areaParam) {
            filtered = filtered.filter(doc => doc.area === areaParam);
        }

        // 3. Filter by Rating
        if (ratingParam) {
            const minRating = parseFloat(ratingParam.replace('+', ''));
            filtered = filtered.filter(doc => parseFloat(doc.rating) >= minRating);
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTotalFiltered(filtered.length);

        // 4. Group the remaining doctors by their specialty
        const grouped = filtered.reduce((acc, doc) => {
            if (!acc[doc.specialty]) {
                acc[doc.specialty] = [];
            }
            acc[doc.specialty].push(doc);
            return acc;
        }, {});

        // Sort the keys alphabetically so departments are in order
        const sortedGrouped = Object.keys(grouped).sort().reduce(
            (obj, key) => {
                obj[key] = grouped[key];
                return obj;
            },
            {}
        );

        setGroupedDoctors(sortedGrouped);
    }, [queryParam, areaParam, ratingParam, doctorsList]);

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

    const openBookingModal = (doctorId) => {
        if (user?.role?.toLowerCase() === 'patient') {
            setBookingForm(prev => ({ ...prev, doctor_id: doctorId }));
            setIsBookingModalOpen(true);
        } else if (user) {
            navigate(`/${user.role?.toLowerCase()}`);
        } else {
            navigate('/login');
        }
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 ${bgBase} ${textBase} flex flex-col`}>

            {/* Top Announcement Bar */}
            <div className={`${isModern ? 'bg-blue-950 text-blue-200' : 'bg-slate-900 text-slate-300'} py-2 px-6 text-xs font-medium flex justify-center items-center transition-colors duration-500`}>
                <div className="flex items-center space-x-4">
                    <span className="flex items-center"><Phone className="w-3 h-3 mr-1.5 text-emerald-400" /> National Helpline: 16263</span>
                </div>
            </div>

            {/* Mini Navbar */}
            <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${borderColor} ${navbarBg} transition-all shadow-sm`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center cursor-pointer">
                        <AnimatedLogo />
                    </Link>
                    <Link to="/" className={`flex items-center text-sm font-medium ${textMuted} hover:text-blue-500 transition-colors`}>
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">

                {/* Header & Stats */}
                <div className="mb-12">
                    <h1 className="text-4xl font-extrabold mb-3">Specialist Directory</h1>
                    <p className={`text-lg ${textMuted}`}>
                        Showing {totalFiltered} doctors {areaParam && `in ${areaParam}`} {queryParam && `matching "${queryParam}"`}
                    </p>

                    {/* Active Filters Pill */}
                    {(queryParam || areaParam || ratingParam) && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {queryParam && <span className={`px-3 py-1 text-sm rounded-full ${isModern ? 'bg-blue-900/40 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>Search: {queryParam}</span>}
                            {areaParam && <span className={`px-3 py-1 text-sm rounded-full ${isModern ? 'bg-blue-900/40 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>Area: {areaParam}</span>}
                            {ratingParam && <span className={`px-3 py-1 text-sm rounded-full ${isModern ? 'bg-blue-900/40 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>Rating: {ratingParam}</span>}
                            <Link to="/doctors" className={`px-3 py-1 text-sm rounded-full text-red-500 hover:bg-red-50 transition-colors`}>Clear All</Link>
                        </div>
                    )}
                </div>

                {/* Grouped Doctor Display */}
                {totalFiltered > 0 ? (
                    <div className="space-y-16">
                        {Object.entries(groupedDoctors).map(([department, doctors]) => (
                            <section key={department} className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* Department Header */}
                                <div className={`flex items-center mb-6 border-b ${borderColor} pb-3`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${isModern ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                        <HeartPulse className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{department} Department</h2>
                                        <p className={`text-sm ${textMuted}`}>{doctors.length} Specialists Available</p>
                                    </div>
                                </div>

                                {/* Doctor Grid for this Department */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {doctors.map(doctor => (
                                        <div key={doctor.id} className={`${bgCard} rounded-2xl border ${borderColor} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col`}>
                                            <div className="flex items-start space-x-4 mb-4">
                                                <img src={doctor.image} alt={doctor.name} className={`w-16 h-16 rounded-full object-cover border-2 ${isModern ? 'border-slate-700' : 'border-blue-100'}`} />
                                                <div>
                                                    <h3 className="text-lg font-bold">{doctor.name}</h3>
                                                    <p className={`font-medium text-sm ${isModern ? 'text-blue-400' : 'text-blue-600'}`}>{doctor.specialty} Specialist</p>
                                                    <div className={`flex items-center text-sm mt-1 ${textMuted}`}>
                                                        <Star className="w-4 h-4 text-amber-400 fill-current mr-1" />
                                                        <span className={`font-bold mr-1 ${textBase}`}>{doctor.rating}</span>
                                                        ({doctor.reviews} reviews)
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`space-y-2 mb-6 flex-grow text-sm ${textMuted}`}>
                                                <div className="flex items-center">
                                                    <MapPin className="w-4 h-4 mr-2" /> {doctor.hospital || "HealNexus Verified Hospital"}, {doctor.area || "Online"}
                                                </div>
                                                <div className="flex items-center text-emerald-500 font-medium">
                                                    <Award className="w-4 h-4 mr-2" /> BMDC Verified
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="w-4 h-4 mr-2" /> Consultation Fee: <span className={`font-bold ml-1 ${textBase}`}>{doctor.fee || "1000 BDT"}</span>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => openBookingModal(doctor.id)}
                                                className={`w-full flex justify-center items-center py-3 rounded-xl font-semibold transition-colors ${isModern ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white'}`}
                                            >
                                                <CalendarPlus className="w-4 h-4 mr-2" /> Book Appointment
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <div className={`${bgCard} text-center py-20 rounded-3xl border ${borderColor}`}>
                        <Search className={`w-12 h-12 mx-auto mb-4 ${textMuted} opacity-50`} />
                        <h3 className="text-xl font-bold mb-2">No specialists found</h3>
                        <p className={textMuted}>Try adjusting your filters or search terms to find what you're looking for.</p>
                        <Link to="/doctors" className={`mt-6 inline-block font-semibold px-6 py-2 rounded-full transition-colors ${isModern ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                            Clear all filters
                        </Link>
                    </div>
                )}
            </main>

            {/* Booking Modal */}
            {isBookingModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in transition-all">
                    <div className={`${bgBase} rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative border ${borderColor} transition-colors`}>
                        <button onClick={() => setIsBookingModalOpen(false)} className={`absolute top-4 right-4 p-2 ${textMuted} hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors`}><X className="w-6 h-6" /></button>
                        <h2 className="text-2xl font-bold mb-2">Book Appointment</h2>
                        <form onSubmit={handleBookAppointment} className="space-y-4 mt-6">
                            <div>
                                <label className={`block text-sm font-bold ${textBase} mb-1`}>Select Doctor</label>
                                <select
                                    required
                                    value={bookingForm.doctor_id}
                                    onChange={(e) => setBookingForm({ ...bookingForm, doctor_id: e.target.value })}
                                    className={`w-full p-3 ${bgCard} border ${borderColor} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none`}
                                    disabled={!!bookingForm.doctor_id}
                                >
                                    <option value="">-- Choose a Doctor --</option>
                                    {doctorsList.map(doc => (
                                        <option key={doc.id} value={doc.id}>Dr. {doc.name} ({doc.specialty || 'General'})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={`block text-sm font-bold ${textBase} mb-1`}>Reason for visit</label>
                                <input required type="text" placeholder="e.g., Routine Checkup, Chest Pain" value={bookingForm.reason} onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })} className={`w-full p-3 ${bgCard} border ${borderColor} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none`} />
                            </div>
                            <div>
                                <label className={`block text-sm font-bold ${textBase} mb-1`}>Attach Document (Optional)</label>
                                <input type="file" onChange={(e) => setBookingForm({ ...bookingForm, file: e.target.files[0] })} className={`w-full p-2 ${bgCard} border ${borderColor} rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50`} />
                            </div>
                            <button type="submit" className="w-full py-3.5 mt-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-colors">Confirm Booking</button>
                        </form>
                    </div>
                </div>
            )}

            {successMsg && (
                <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 font-bold flex items-center shadow-lg animate-in fade-in slide-in-from-bottom-5">
                    <CheckCircle className="w-5 h-5 mr-2" /> {successMsg}
                </div>
            )}

            <Footer />
        </div>
    );
}
