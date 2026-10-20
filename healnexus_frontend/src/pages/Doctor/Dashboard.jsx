import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Calendar, Users, FileSignature, LogOut, Clock,
    CheckCircle, AlertCircle, Search, Pill, Send, Loader2, User, Eye, X, ExternalLink, FileText, PlusCircle, Check,
    TrendingUp, Award, Star, Video, Settings, Briefcase, Save, Phone, Activity
} from 'lucide-react';
import api from '../../services/api';
import AnimatedLogo from '../../components/common/AnimatedLogo';

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [activeTab, setActiveTab] = useState('home');
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Live Data State
    const [dashboardData, setDashboardData] = useState({
        doctor_name: '', specialty: '', bio: '', availability: null, stats: { attended: 0, waiting_today: 0, waiting_tomorrow: 0 },
        appointments: [], patients: [], reviews: []
    });

    // Form States
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileForm, setProfileForm] = useState({ specialization: '', bio: '', phone: '' });

    const [isAvailModalOpen, setIsAvailModalOpen] = useState(false);
    const [availForm, setAvailForm] = useState('');

    // Rx Form States
    const [rxForm, setRxForm] = useState({
        patient_id: '',
        appointment_id: null,
        medicines: [{ name: '', dosage: '', frequency: '1+0+1', duration: '7 days' }],
        notes: ''
    });
    const [rxSuccess, setRxSuccess] = useState(false);

    // Confirmation Modal States
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, apt: null, date_time: '', meet_link: '' });
    const [rejectModal, setRejectModal] = useState({ isOpen: false, apt: null, reason: '' });
    const [negotiateModal, setNegotiateModal] = useState({ isOpen: false, apt: null, suggested_time: '' });

    // --- Phase 2 States ---
    const [reviewModal, setReviewModal] = useState({ isOpen: false, apt: null });
    const [ongoingVisit, setOngoingVisit] = useState(null);
    const [visitNotes, setVisitNotes] = useState('');

    // --- State for Consultation Chat ---
    const [chatModal, setChatModal] = useState({ isOpen: false, apt: null });
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);

    // --- State for Patient History ---
    const [historyModal, setHistoryModal] = useState({ isOpen: false, patient_id: null, patient_name: '' });
    const [patientHistory, setPatientHistory] = useState({ prescriptions: [], medical_records: [] });
    const [loadingHistory, setLoadingHistory] = useState(false);

    // --- State for Document Viewer ---
    const [viewDocument, setViewDocument] = useState(null);
    const API_BASE_URL = 'http://127.0.0.1:8000';

    // Filter patients based on search box
    const filteredPatients = dashboardData.patients.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- 1. FETCH LIVE DOCTOR DATA ---
    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/login');

            try {
                const response = await api.get('/doctor/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDashboardData(response.data);
            } catch (err) {
                if (err.response?.status === 401 || err.response?.status === 403) {
                    localStorage.removeItem('token');
                    navigate('/login');
                } else {
                    setError('Failed to load clinical data.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [navigate, refreshTrigger]);

    useEffect(() => {
        if (dashboardData.doctor_name) {
            setProfileForm({
                specialization: dashboardData.specialty || '',
                bio: dashboardData.bio || '',
                phone: dashboardData.phone || ''
            });
            setAvailForm(dashboardData.availability ? JSON.stringify(dashboardData.availability, null, 2) : '');
        }
    }, [dashboardData]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleConfirmAppointment = async (e) => {
        e.preventDefault();

        const meetRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
        if (confirmModal.meet_link && !meetRegex.test(confirmModal.meet_link)) {
            alert("Please provide a valid URL for the meeting link.");
            return;
        }

        const token = localStorage.getItem('token');
        try {
            await api.put(`/doctor/appointments/${confirmModal.apt.id}/confirm`, {
                date_time: confirmModal.date_time,
                meet_link: confirmModal.meet_link
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConfirmModal({ isOpen: false, apt: null, date_time: '', meet_link: '' });
            setSuccessMsg("Appointment scheduled and Meet link shared!");
            setRefreshTrigger(prev => prev + 1);
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
            alert(err.response?.data?.detail || "Failed to confirm appointment.");
        }
    };

    const handleRejectAppointment = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await api.put(`/doctor/appointments/${rejectModal.apt.id}/reject`, {
                rejection_reason: rejectModal.reason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRejectModal({ isOpen: false, apt: null, reason: '' });
            setSuccessMsg("Appointment rejected.");
            setRefreshTrigger(prev => prev + 1);
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) { alert("Failed to reject."); }
    };

    const handleNegotiateAppointment = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await api.put(`/doctor/appointments/${negotiateModal.apt.id}/negotiate`, {
                suggested_time: negotiateModal.suggested_time
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNegotiateModal({ isOpen: false, apt: null, suggested_time: '' });
            setSuccessMsg("Alternative time sent to patient.");
            setRefreshTrigger(prev => prev + 1);
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) { alert("Failed to suggest time."); }
    };

    // --- CHAT LOGIC ---
    useEffect(() => {
        if (chatModal.isOpen && chatModal.apt) {
            const token = localStorage.getItem('token');
            const user_id = JSON.parse(atob(token.split('.')[1])).id;

            api.get(`/chat/${chatModal.apt.id}/history`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => setMessages(res.data));

            const ws = new WebSocket(`ws://127.0.0.1:8000/chat/ws/${user_id}`);
            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.appointment_id === chatModal.apt.id) {
                    setMessages(prev => [...prev, msg]);
                }
            };
            setSocket(ws);

            return () => ws.close();
        }
    }, [chatModal.isOpen, chatModal.apt]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const payload = {
            appointment_id: chatModal.apt.id,
            receiver_id: chatModal.apt.patient_id,
            content: newMessage
        };
        socket.send(JSON.stringify(payload));
        setNewMessage('');
    };

    // --- DYNAMIC PRESCRIPTION HANDLERS ---
    const handleAddMedicine = () => {
        setRxForm(prev => ({
            ...prev,
            medicines: [...prev.medicines, { name: '', dosage: '', frequency: '1+0+1', duration: '7 days' }]
        }));
    };

    const handleRemoveMedicine = (indexToRemove) => {
        setRxForm(prev => ({
            ...prev,
            medicines: prev.medicines.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleMedicineChange = (index, field, value) => {
        const newMeds = [...rxForm.medicines];
        newMeds[index][field] = value;
        setRxForm({ ...rxForm, medicines: newMeds });
    };

    const handleSendPrescription = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await api.post('/doctor/prescriptions', {
                patient_id: parseInt(rxForm.patient_id),
                appointment_id: rxForm.appointment_id ? parseInt(rxForm.appointment_id) : null,
                medicines: rxForm.medicines,
                notes: rxForm.notes
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRxSuccess(true);
            setTimeout(() => {
                setRxSuccess(false);
                setRxForm({ patient_id: '', appointment_id: null, medicines: [{ name: '', dosage: '', frequency: '1+0+1', duration: '7 days' }], notes: '' });
            }, 3000);
        } catch (err) { alert("Failed to send prescription."); }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await api.put('/doctor/profile', profileForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccessMsg("Professional profile updated!");
            setRefreshTrigger(prev => prev + 1);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) { alert("Failed to update profile."); }
    };

    const handleUpdateAvailability = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await api.put('/doctor/availability', { availability: availForm }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccessMsg("Availability schedule saved!");
            setRefreshTrigger(prev => prev + 1);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) { alert("Failed to save availability."); }
    };

    const fetchPatientHistory = async (patientId, patientName) => {
        setLoadingHistory(true);
        setHistoryModal({ isOpen: true, patient_id: patientId, patient_name: patientName });
        const token = localStorage.getItem('token');
        try {
            const res = await api.get(`/doctor/patients/${patientId}/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatientHistory(res.data);
        } catch (err) {
            alert("Could not load patient history. (Privacy restriction)");
            setHistoryModal({ isOpen: false, patient_id: null, patient_name: '' });
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleStartVisit = async (aptId) => {
        if (!window.confirm("Are you sure you want to start this visit now? Status will be 'Ongoing'.")) return;
        const token = localStorage.getItem('token');
        try {
            await api.put(`/doctor/appointments/${aptId}/start`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRefreshTrigger(prev => prev + 1);
            setSuccessMsg("Consultation is now Ongoing.");
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) { alert("Failed to start visit."); }
    };

    const handleEndVisit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await api.put(`/doctor/appointments/${ongoingVisit.id}/end`, { visit_notes: visitNotes }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOngoingVisit(null);
            setVisitNotes('');
            setRefreshTrigger(prev => prev + 1);
            setSuccessMsg("Consultation completed and archived.");
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) { alert("Failed to end visit."); }
    };

    const pendingApts = dashboardData.appointments.filter(a => a.status === 'Pending' || a.status === 'Negotiating');
    const scheduledApts = dashboardData.appointments.filter(a => a.status === 'Scheduled' || a.status === 'Ongoing');

    if (loading) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center"><Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" /><p className="text-slate-500 font-medium animate-pulse">Loading clinical profile...</p></div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020817] flex flex-col md:flex-row font-sans relative transition-colors duration-500">

            {/* --- SIDEBAR --- */}
            <aside className="w-full md:w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col md:min-h-screen sticky top-0 md:h-screen z-20 shadow-xl transition-colors duration-500">
                <div className="p-6 flex items-center border-b border-slate-800 bg-slate-950 dark:bg-black/20">
                    <AnimatedLogo />
                </div>
                <div className="p-4 flex-1 overflow-y-auto">
                    <nav className="space-y-1.5">
                        <button onClick={() => setActiveTab('home')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
                            <TrendingUp className="w-5 h-5" /> <span className="font-medium">Home Overview</span>
                        </button>
                        <button onClick={() => setActiveTab('schedule')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'schedule' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
                            <Calendar className="w-5 h-5" /> <span className="font-medium">Full Schedule</span>
                        </button>
                        <button onClick={() => setActiveTab('patients')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'patients' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}>
                            <Users className="w-5 h-5" /> <span className="font-medium">Patient Database</span>
                        </button>
                        <button onClick={() => setActiveTab('prescriptions')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'prescriptions' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
                            <FileSignature className="w-5 h-5" /> <span className="font-medium">Write e-Rx</span>
                        </button>
                        <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
                            <Settings className="w-5 h-5" /> <span className="font-medium">Profile Settings</span>
                        </button>
                    </nav>

                    {ongoingVisit && (
                        <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-pulse">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div> Ongoing Consultation
                            </p>
                            <p className="text-sm font-bold text-white mb-3">{ongoingVisit.patient_name}</p>
                            <button
                                onClick={() => setOngoingVisit({ ...ongoingVisit })}
                                className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                Resume Notes
                            </button>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-800 bg-slate-950 dark:bg-black/20">
                    <div className="flex items-center px-4 py-3 mb-2 rounded-xl bg-slate-800/50">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-3 shrink-0"><User className="w-4 h-4" /></div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">Dr. {dashboardData.doctor_name.split(' ')[0]}</p>
                            <p className="text-[10px] text-slate-400 uppercase">{dashboardData.specialty}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium text-sm">
                        <LogOut className="w-4 h-4" /> <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 p-6 md:p-10 max-w-7xl overflow-y-auto">
                {successMsg && <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 font-bold flex items-center shadow-lg animate-in fade-in"><CheckCircle className="w-5 h-5 mr-2" /> {successMsg}</div>}

                {/* --- 1. DEDICATED DOCTOR HOME TAB --- */}
                {activeTab === 'home' && (
                    <div className="animate-in fade-in duration-700">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 opacity-10"><Award className="w-40 h-40" /></div>
                                    <h1 className="text-4xl font-black mb-2">Clinical Performance</h1>
                                    <p className="text-slate-400 mb-10">Real-time statistics of your medical practice.</p>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Attended</p>
                                            <p className="text-4xl font-black text-emerald-400">{dashboardData.stats.attended}</p>
                                            <p className="text-[10px] text-slate-500 mt-2">Lifetime total</p>
                                        </div>
                                        <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Today</p>
                                            <p className="text-4xl font-black text-blue-400">{dashboardData.stats.waiting_today}</p>
                                            <p className="text-[10px] text-slate-500 mt-2">Waiting patients</p>
                                        </div>
                                        <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Tomorrow</p>
                                            <p className="text-4xl font-black text-purple-400">{dashboardData.stats.waiting_tomorrow}</p>
                                            <p className="text-[10px] text-slate-500 mt-2">Scheduled visits</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
                                    <h3 className="text-xl font-bold mb-6 flex items-center"><Star className="w-5 h-5 mr-2 text-amber-400 fill-current" /> Recent Patient Reviews</h3>
                                    <div className="space-y-4">
                                        {dashboardData.reviews.map(r => (
                                            <div key={r.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl italic text-sm text-slate-600 dark:text-slate-300">
                                                "{r.comment}"
                                                <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">— {r.patient}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-900/10">
                                    <h2 className="text-lg font-bold flex items-center"><Clock className="w-5 h-5 mr-2 text-amber-500" /> New Requests</h2>
                                </div>
                                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {pendingApts.length > 0 ? pendingApts.map(app => (
                                        <div key={app.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="font-bold text-slate-900 dark:text-white">{app.patient_name}</p>
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${app.status === 'Negotiating' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{app.status}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{app.reason}</p>
                                            <button
                                                onClick={() => setReviewModal({ isOpen: true, apt: app })}
                                                className="w-full py-2 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                Review Request
                                            </button>
                                        </div>
                                    )) : (
                                        <div className="p-10 text-center text-slate-400 text-sm italic">No pending requests</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Previously Attended Patients</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {dashboardData.patients.length > 0 ? dashboardData.patients.map(p => (
                                    <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-bold">{p.name.charAt(0)}</div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                                                <p className="text-[10px] text-slate-500 uppercase">Last Visit: {p.last_visit}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => fetchPatientHistory(p.id, p.name)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="View History"><Activity className="w-5 h-5" /></button>
                                            <button onClick={() => { setRxForm({ ...rxForm, patient_id: p.id }); setActiveTab('prescriptions'); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Draft Rx"><FileSignature className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-10 text-center text-slate-400 italic">No patients attended yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SCHEDULE TAB --- */}
                {activeTab === 'schedule' && (
                    <div className="space-y-10 animate-in fade-in">
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                                <h2 className="text-xl font-bold flex items-center"><Calendar className="w-5 h-5 mr-2 text-blue-600" /> Confirmed Schedule</h2>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {scheduledApts.map(app => (
                                    <div key={app.id} className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <div className="flex items-start space-x-5">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-3xl text-blue-700 dark:text-blue-400 font-black text-center min-w-[100px] border border-blue-100 dark:border-blue-900/50">
                                                {app.date} <br /> <span className="text-xs font-medium">{app.time}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{app.patient_name}</h3>
                                                <p className="text-sm text-slate-500 mt-1">{app.reason}</p>
                                                {app.meet_link && (
                                                    <a href={app.meet_link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                                                        <Video className="w-3.5 h-3.5 mr-1" /> Join Google Meet
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {app.document_path && <button onClick={() => setViewDocument(app.document_path)} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors">View Records</button>}
                                            <button onClick={() => fetchPatientHistory(app.patient_id, app.patient_name)} className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-xl hover:bg-indigo-100 transition-colors">History</button>
                                            <button onClick={() => setChatModal({ isOpen: true, apt: app })} className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-xl hover:bg-blue-100 transition-colors">Chat</button>

                                            {app.status === 'Ongoing' ? (
                                                <button onClick={() => setOngoingVisit(app)} className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl animate-pulse flex items-center">
                                                    <div className="w-2 h-2 bg-white rounded-full mr-2"></div> Ongoing
                                                </button>
                                            ) : (
                                                <button onClick={() => handleStartVisit(app.id)} className="px-6 py-2.5 bg-slate-900 dark:bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md">Start Visit</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- LIVE PATIENT DATABASE TAB --- */}
                {activeTab === 'patients' && (
                    <div className="animate-in fade-in">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Patient Database</h2>
                                <p className="text-sm text-slate-500">Showing all patients who have booked you.</p>
                            </div>
                            <div className="relative w-full md:w-72">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search patients..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredPatients.length > 0 ? (
                                filteredPatients.map(patient => (
                                    <div key={patient.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center hover:border-blue-300 dark:hover:border-blue-700 transition-colors group cursor-pointer">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold border border-slate-200 dark:border-slate-700">
                                                {patient.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">{patient.name}</h3>
                                                <p className="text-xs text-slate-500 mt-0.5">Age: {patient.age || 'N/A'} • Gender: {patient.gender || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md inline-block mb-2 border border-slate-200 dark:border-slate-700">ID: {patient.id}</p>
                                            <div className="flex space-x-2">
                                                <button onClick={(e) => { e.stopPropagation(); fetchPatientHistory(patient.id, patient.name); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors" title="View History"><Activity className="w-4 h-4" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); setRxForm({ ...rxForm, patient_id: patient.id }); setActiveTab('prescriptions'); }} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors" title="Draft Rx"><FileSignature className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-1 lg:col-span-2 text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <p className="text-slate-500">No patients found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- WRITE e-Rx TAB --- */}
                {activeTab === 'prescriptions' && (
                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm max-w-3xl animate-in fade-in">
                        <div className="flex items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mr-4"><FileSignature className="w-6 h-6" /></div>
                            <div>
                                <h2 className="text-2xl font-bold">Draft e-Prescription</h2>
                                <p className="text-sm text-slate-500">Send instantly to Patient's secure vault.</p>
                            </div>
                        </div>

                        {rxSuccess ? (
                            <div className="py-20 text-center"><CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" /><h3 className="text-2xl font-bold">Prescription Sent!</h3></div>
                        ) : (
                            <form onSubmit={handleSendPrescription} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Patient Selection</label>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Search className="w-4 h-4" /></div>
                                        <select
                                            required
                                            disabled={!!ongoingVisit}
                                            value={rxForm.patient_id}
                                            onChange={(e) => setRxForm({ ...rxForm, patient_id: e.target.value })}
                                            className="w-full pl-12 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white appearance-none disabled:bg-blue-50/50"
                                        >
                                            <option value="">-- Choose Patient --</option>
                                            {ongoingVisit ? (
                                                <option value={ongoingVisit.patient_id}>Active Visit: {ongoingVisit.patient_name}</option>
                                            ) : (
                                                dashboardData.patients.map(p => <option key={p.id} value={p.id}>{p.name} (Age: {p.age})</option>)
                                            )}
                                        </select>
                                        {ongoingVisit && <p className="text-[10px] text-blue-600 font-bold uppercase mt-2 px-1">Prescription is locked to active consultation</p>}
                                    </div>
                                </div>

                                {/* DYNAMIC MEDICINES LIST */}
                                <div className="space-y-4 pt-2">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Medications List</label>

                                    {rxForm.medicines.map((med, index) => (
                                        <div key={index} className="relative p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl group">
                                            {/* Remove Button (Only show if there's more than 1 medicine) */}
                                            {rxForm.medicines.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMedicine(index)}
                                                    className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors"
                                                    title="Remove this medicine"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Medicine Name</label>
                                                    <div className="relative">
                                                        <Pill className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input required type="text" placeholder="e.g., Napa Extend"
                                                            value={med.name}
                                                            onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                                                            className="w-full pl-9 pr-3 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Dosage</label>
                                                    <input required type="text" placeholder="e.g., 500mg"
                                                        value={med.dosage}
                                                        onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                                                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Frequency</label>
                                                    <input required type="text" placeholder="e.g., 1+0+1 after meal"
                                                        value={med.frequency}
                                                        onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                                                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Duration</label>
                                                    <input required type="text" placeholder="e.g., 7 days"
                                                        value={med.duration}
                                                        onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                                                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={handleAddMedicine}
                                        className="mt-2 flex items-center px-4 py-3 text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors w-full justify-center border border-dashed border-blue-200 dark:border-blue-800"
                                    >
                                        <PlusCircle className="w-4 h-4 mr-2" /> Add Another Medicine
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 mt-4">Clinical Notes / Advice</label>
                                    <textarea rows="3" placeholder="Rest for 3 days, drink plenty of water..."
                                        value={rxForm.notes}
                                        onChange={(e) => setRxForm({ ...rxForm, notes: e.target.value })}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none dark:text-white"></textarea>
                                </div>

                                <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center uppercase tracking-widest text-xs mt-4">
                                    <Send className="w-4 h-4 mr-2" /> Dispatch Digital Rx
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* --- SETTINGS TAB: PROFILE & AVAILABILITY --- */}
                {activeTab === 'settings' && (
                    <div className="animate-in fade-in space-y-8 max-w-4xl">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Profile & Availability</h1>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl flex items-center justify-center mr-3"><Briefcase className="w-5 h-5" /></div>
                                    <h3 className="text-xl font-bold">Professional Profile</h3>
                                </div>
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Medical License</p>
                                            <p className="font-bold text-slate-700 dark:text-slate-300">{dashboardData.license_no || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Specialization</label>
                                        <input type="text" value={profileForm.specialization} onChange={e => setProfileForm({ ...profileForm, specialization: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Professional Bio</label>
                                        <textarea rows="4" value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" placeholder="Describe your experience and approach..."></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Contact Phone</label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="text" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center"><Save className="w-4 h-4 mr-2" /> Save Profile</button>
                                </form>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl flex items-center justify-center mr-3"><Clock className="w-5 h-5" /></div>
                                    <h3 className="text-xl font-bold">Weekly Availability</h3>
                                </div>
                                <p className="text-xs text-slate-500 mb-4">Set your active hours for patient bookings. Use a JSON-like or descriptive format.</p>
                                <form onSubmit={handleUpdateAvailability} className="space-y-4">
                                    <textarea rows="8" value={availForm} onChange={e => setAvailForm(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xs focus:ring-2 focus:ring-amber-500 outline-none dark:text-white" placeholder={'{\n  "Mon-Fri": "9:00 AM - 5:00 PM",\n  "Sat": "10:00 AM - 2:00 PM"\n}'}></textarea>
                                    <button type="submit" className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-all flex items-center justify-center"><Save className="w-4 h-4 mr-2" /> Update Schedule</button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* --- MODALS (Unchanged functionality) --- */}

            {/* Confirm Appointment */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in transition-all">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800 transition-colors">
                        <button onClick={() => setConfirmModal({ isOpen: false, apt: null, date_time: '', meet_link: '' })} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Confirm Appointment</h2>

                        <form onSubmit={handleConfirmAppointment} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest text-[10px]">Consultation Date & Time</label>
                                <input required type="datetime-local" value={confirmModal.date_time} onChange={(e) => setConfirmModal({ ...confirmModal, date_time: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest text-[10px]">Google Meet Link</label>
                                <div className="relative">
                                    <Video className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input placeholder="https://meet.google.com/xxx-xxxx-xxx" type="url" value={confirmModal.meet_link} onChange={(e) => setConfirmModal({ ...confirmModal, meet_link: e.target.value })} className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-900/20 transition-all">Schedule & Send Link</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in transition-all">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800">
                        <button onClick={() => setRejectModal({ isOpen: false, apt: null, reason: '' })} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 rounded-full"><X className="w-6 h-6" /></button>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Decline Appointment</h2>
                        <form onSubmit={handleRejectAppointment} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Reason for Rejection</label>
                                <textarea required value={rejectModal.reason} onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm dark:text-white" rows="4" placeholder="e.g. Out of office, Please book with another specialist..."></textarea>
                            </div>
                            <button type="submit" className="w-full py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg">Confirm Rejection</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Suggest Time Modal */}
            {negotiateModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in transition-all">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800">
                        <button onClick={() => setNegotiateModal({ isOpen: false, apt: null, suggested_time: '' })} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-amber-500 rounded-full"><X className="w-6 h-6" /></button>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Suggest Alternative Time</h2>
                        <form onSubmit={handleNegotiateAppointment} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest text-[10px]">Your Proposed Slot</label>
                                <input required type="datetime-local" value={negotiateModal.suggested_time} onChange={(e) => setNegotiateModal({ ...negotiateModal, suggested_time: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm dark:text-white" />
                            </div>
                            <button type="submit" className="w-full py-4 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-all shadow-lg">Send Suggestion</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Document Viewer */}
            {viewDocument && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Patient Document</h2>
                            <button onClick={() => setViewDocument(null)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-4">
                            <iframe src={`${API_BASE_URL}/${viewDocument}`} className="w-full h-full rounded-xl" title="Viewer" />
                        </div>
                    </div>
                </div>
            )}

            {/* Consultation Chat Modal */}
            {chatModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-blue-50/30 dark:bg-blue-900/10">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black">{chatModal.apt.patient_name.charAt(0)}</div>
                                <div>
                                    <h2 className="text-lg font-bold">Chat with {chatModal.apt.patient_name}</h2>
                                    <div className="flex items-center space-x-3 mt-1">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Active Consultation</p>
                                        {chatModal.apt.document_path && (
                                            <button
                                                onClick={() => setViewDocument(chatModal.apt.document_path)}
                                                className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors flex items-center"
                                            >
                                                <FileText className="w-3 h-3 mr-1" /> View Shared Record
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setNegotiateModal({ isOpen: true, apt: chatModal.apt, suggested_time: '' })}
                                    className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-all shadow-md shadow-amber-900/20 flex items-center"
                                >
                                    <Clock className="w-3.5 h-3.5 mr-2" /> Suggest Time
                                </button>
                                <button
                                    onClick={() => { setRxForm({ ...rxForm, patient_id: chatModal.apt.patient_id, appointment_id: chatModal.apt.id }); setActiveTab('prescriptions'); setChatModal({ isOpen: false, apt: null }); }}
                                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-900/20 flex items-center"
                                >
                                    <FileSignature className="w-3.5 h-3.5 mr-2" /> Draft e-Rx
                                </button>
                                <button onClick={() => setChatModal({ isOpen: false, apt: null })} className="p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-full shadow-sm transition-all"><X className="w-6 h-6" /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                            {messages.map((m, i) => {
                                const isMe = m.sender_id !== chatModal.apt.patient_id;
                                return (
                                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'}`}>
                                            {m.content}
                                            <p className={`text-[9px] mt-1 opacity-60 font-bold ${isMe ? 'text-right' : 'text-left'}`}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-3">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type medical advice or query..."
                                className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                            />
                            <button type="submit" className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"><Send className="w-5 h-5" /></button>
                        </form>
                    </div>
                </div>
            )}

            {/* Patient Clinical History Modal */}
            {historyModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-50/30 dark:bg-indigo-900/10">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-900/20">{historyModal.patient_name.charAt(0)}</div>
                                <div>
                                    <h2 className="text-xl font-bold">Clinical History: {historyModal.patient_name}</h2>
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Confidential Medical Record</p>
                                </div>
                            </div>
                            <button onClick={() => setHistoryModal({ isOpen: false, patient_id: null, patient_name: '' })} className="p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-full shadow-sm transition-all"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 bg-slate-50/50 dark:bg-slate-950/50">
                            {loadingHistory ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-20"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" /><p className="font-bold text-slate-400 uppercase text-xs tracking-tighter">Securely retrieving records...</p></div>
                            ) : (
                                <>
                                    <div className="space-y-6">
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center"><FileSignature className="w-4 h-4 mr-2" /> Prescription History</h3>
                                        <div className="space-y-4">
                                            {patientHistory.prescriptions.length > 0 ? patientHistory.prescriptions.map(rx => (
                                                <div key={rx.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">{new Date(rx.date).toLocaleDateString()}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold italic">By Dr. {rx.doctor_name}</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {rx.medicines.map((m, i) => (
                                                            <div key={i} className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center">• {m.name} <span className="ml-2 text-[10px] text-slate-500 font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">{m.dosage}</span></div>
                                                        ))}
                                                    </div>
                                                    {rx.notes && <p className="mt-3 text-xs text-slate-500 italic border-t border-slate-50 dark:border-slate-800 pt-2">Notes: {rx.notes}</p>}
                                                </div>
                                            )) : <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic">No previous prescriptions found.</div>}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center"><FileText className="w-4 h-4 mr-2" /> Shared Vault Records</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {patientHistory.medical_records.length > 0 ? patientHistory.medical_records.map(rec => (
                                                <div key={rec.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors"><FileText className="w-5 h-5" /></div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{rec.record_type}</p>
                                                            <p className="text-[10px] text-slate-500">{new Date(rec.uploaded_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setViewDocument(rec.file_path)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Eye className="w-5 h-5" /></button>
                                                </div>
                                            )) : <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic">No shared medical documents found.</div>}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Review Appointment Request Modal */}
            {reviewModal.isOpen && reviewModal.apt && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h2 className="text-xl font-bold">Review Request</h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Pending Physician Approval</p>
                            </div>
                            <button onClick={() => setReviewModal({ isOpen: false, apt: null })} className="p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-full"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl">{reviewModal.apt.patient_name.charAt(0)}</div>
                                <div>
                                    <h3 className="text-lg font-bold">{reviewModal.apt.patient_name}</h3>
                                    <p className="text-sm text-slate-500 italic">" {reviewModal.apt.reason} "</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center"><FileText className="w-3.5 h-3.5 mr-1.5" /> Shared Clinical Records</h4>
                                {reviewModal.apt.document_path ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-200">
                                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center mr-3 shadow-sm border border-slate-100 dark:border-slate-700"><FileText className="w-5 h-5 text-blue-500" /></div>
                                            Patient_Shared_Record.pdf
                                        </div>
                                        <button onClick={() => setViewDocument(reviewModal.apt.document_path)} className="px-4 py-2 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center"><Eye className="w-3.5 h-3.5 mr-1.5" /> Preview Now</button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No documents shared with this request.</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => { setConfirmModal({ isOpen: true, apt: reviewModal.apt, date_time: '', meet_link: '' }); setReviewModal({ isOpen: false, apt: null }); }}
                                    className="py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20"
                                >
                                    Accept & Schedule
                                </button>
                                <button
                                    onClick={() => { setRejectModal({ isOpen: true, apt: reviewModal.apt, reason: '' }); setReviewModal({ isOpen: false, apt: null }); }}
                                    className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all"
                                >
                                    Decline Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* End Visit & Notes Modal */}
            {ongoingVisit && (
                <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[90] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-3xl shadow-2xl overflow-hidden border-4 border-emerald-500/20 animate-in slide-in-from-bottom-10">
                        <div className="p-10 flex flex-col md:flex-row items-center gap-10">
                            <div className="flex-1 space-y-6">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                                    <p className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em]">Visit Ongoing</p>
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white">Consultation with {ongoingVisit.patient_name}</h2>

                                <form onSubmit={handleEndVisit} className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Clinical Progress Notes</label>
                                        <textarea
                                            required
                                            rows="8"
                                            value={visitNotes}
                                            onChange={(e) => setVisitNotes(e.target.value)}
                                            className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm dark:text-white transition-all shadow-inner"
                                            placeholder="Document patient concerns, observations, and preliminary diagnosis..."
                                        ></textarea>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => { setRxForm({ ...rxForm, patient_id: ongoingVisit.patient_id, appointment_id: ongoingVisit.id }); setActiveTab('prescriptions'); }}
                                            className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg shadow-blue-900/20"
                                        >
                                            <FileSignature className="w-5 h-5 mr-2" /> Issue e-Prescription
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center shadow-lg shadow-emerald-900/20"
                                        >
                                            <CheckCircle className="w-5 h-5 mr-2" /> Complete Visit
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}