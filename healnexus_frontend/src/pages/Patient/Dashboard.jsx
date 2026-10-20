import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    LogOut, Calendar, FileText, Activity,
    Video, PlusCircle, Clock, Loader2, User, X, CheckCircle,
    Pill, Stethoscope, FileSignature, LayoutDashboard, Eye, ExternalLink, ChevronDown, ChevronUp, Trash2,
    Download, Printer, Share2, Send, Upload
} from 'lucide-react';
import api from '../../services/api';
import AnimatedLogo from '../../components/common/AnimatedLogo';

export default function PatientDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [activeTab, setActiveTab] = useState('overview');

    const [dashboardData, setDashboardData] = useState({
        patient_name: '', email: '', appointments: [], medical_records: [], prescriptions: [], available_doctors: []
    });

    // --- MODAL STATES ---
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [viewRecord, setViewRecord] = useState(null);
    const [isVaultExpanded, setIsVaultExpanded] = useState(false);
    const [rxModal, setRxModal] = useState({ isOpen: false, data: null });

    // --- CHAT STATES ---
    const [chatModal, setChatModal] = useState({ isOpen: false, apt: null });
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);

    // --- RESCHEDULE STATES ---
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [rescheduleForm, setRescheduleForm] = useState({ apt_id: null, date: '', slot: 'Morning' });

    const [bookingForm, setBookingForm] = useState({ doctor_id: '', reason: '', file: null, existing_record_id: '' });
    const [uploadForm, setUploadForm] = useState({ record_type: 'Lab Report', description: '', file: null });

    const API_BASE_URL = 'http://127.0.0.1:8000';
    const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    const validateFile = (file) => {
        if (!file) return true;
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            alert(`Unsupported file type: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
            return false;
        }
        if (file.size > MAX_FILE_SIZE) {
            alert("File too large. Max size allowed is 5MB.");
            return false;
        }
        return true;
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/login');

            try {
                const response = await api.get('/patient/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDashboardData(response.data);
            } catch (err) {
                if (err.response?.status === 401 || err.response?.status === 403) {
                    localStorage.removeItem('token');
                    navigate('/login');
                } else {
                    setError('Failed to load your health data.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [navigate, refreshTrigger]);

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        if (bookingForm.file && !validateFile(bookingForm.file)) return;
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('doctor_id', bookingForm.doctor_id);
        formData.append('reason', bookingForm.reason);
        if (bookingForm.existing_record_id) formData.append('existing_record_id', bookingForm.existing_record_id);
        else if (bookingForm.file) formData.append('file', bookingForm.file);

        try {
            await api.post('/patient/appointments', formData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            setIsBookingModalOpen(false);
            setSuccessMsg("Request sent! Wait for doctor to set time.");
            setBookingForm({ doctor_id: '', reason: '', file: null, existing_record_id: '' });
            setRefreshTrigger(prev => prev + 1);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) { alert("Failed to book appointment."); }
    };

    const handleRespondNegotiation = async (aptId, accept) => {
        const token = localStorage.getItem('token');
        try {
            await api.put(`/patient/appointments/${aptId}/respond-negotiation`, { accept }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(accept ? "Appointment confirmed!" : "Alternative time declined.");
            setRefreshTrigger(prev => prev + 1);
        } catch (err) { alert("Action failed."); }
    };

    const handleRescheduleRequest = async (e) => {
        e.preventDefault();
        setIsRescheduleModalOpen(false);
        setSuccessMsg(`Reschedule request for ${rescheduleForm.date} (${rescheduleForm.slot}) sent to doctor.`);
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    const handleUploadRecord = async (e) => {
        e.preventDefault();
        if (!uploadForm.file || !validateFile(uploadForm.file)) return;
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('record_type', uploadForm.record_type);
        formData.append('description', uploadForm.description);
        formData.append('file', uploadForm.file);
        try {
            await api.post('/patient/records', formData, {
                headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
            });
            setIsUploadModalOpen(false);
            setSuccessMsg("Medical record safely uploaded to vault!");
            setUploadForm({ record_type: 'Lab Report', description: '', file: null });
            setRefreshTrigger(prev => prev + 1);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) { alert("Failed to upload record."); }
    };

    const handleDeleteRecord = async (recordId) => {
        if (!window.confirm("Are you sure?")) return;
        const token = localStorage.getItem('token');
        try {
            await api.delete(`/patient/records/${recordId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            setRefreshTrigger(prev => prev + 1);
        } catch (err) { alert("Failed to delete."); }
    };

    // --- CHAT LOGIC WITH RECONNECTION ---
    useEffect(() => {
        let ws;
        let reconnectTimeout;

        const connect = () => {
            if (!chatModal.isOpen || !chatModal.apt) return;

            const token = localStorage.getItem('token');
            if (!token) return;
            
            let user_id;
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                user_id = payload.id;
            } catch (e) { return; }

            if (!user_id) return;

            const wsUrl = `ws://localhost:8000/chat/ws/${user_id}`;
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => console.log("Chat Connected");
            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.appointment_id === chatModal.apt.id) setMessages(prev => [...prev, msg]);
            };

            ws.onclose = () => {
                reconnectTimeout = setTimeout(connect, 3000);
            };

            setSocket(ws);
        };

        if (chatModal.isOpen && chatModal.apt) {
            const token = localStorage.getItem('token');
            api.get(`/chat/${chatModal.apt.id}/history`, { headers: { Authorization: `Bearer ${token}` } })
               .then(res => setMessages(res.data));
            connect();
        }

        return () => {
            if (ws) ws.close();
            clearTimeout(reconnectTimeout);
        };
    }, [chatModal.isOpen, chatModal.apt]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;
        socket.send(JSON.stringify({ appointment_id: chatModal.apt.id, receiver_id: chatModal.apt.doctor_id, content: newMessage }));
        setNewMessage('');
    };

    const printPrescription = () => {
        const printContent = document.getElementById('printable-rx');
        const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900');
        windowPrint.document.write(`<html><head><title>HealNexus e-Rx</title><style>body{font-family:sans-serif;padding:40px;}.header{display:flex;justify-content:space-between;border-bottom:2px solid #2563eb;padding-bottom:20px;}.rx-title{color:#2563eb;font-size:24px;font-weight:900;}</style></head><body>${printContent.innerHTML}</body></html>`);
        windowPrint.document.close();
        windowPrint.focus();
        windowPrint.print();
        windowPrint.close();
    };

    const displayedRecords = isVaultExpanded ? dashboardData.medical_records : dashboardData.medical_records.slice(0, 5);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020817] flex flex-col md:flex-row transition-colors duration-500">
            {/* SIDEBAR */}
            <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col md:h-screen sticky top-0 z-20">
                <div className="p-6 border-b border-slate-800"><AnimatedLogo /></div>
                <nav className="p-4 flex-1 space-y-2">
                    <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}><LayoutDashboard className="w-5 h-5" /><span>Dashboard</span></button>
                    <button onClick={() => setActiveTab('prescriptions')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl ${activeTab === 'prescriptions' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}><FileSignature className="w-5 h-5" /><span>Prescriptions</span></button>
                    <button onClick={() => setIsBookingModalOpen(true)} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800"><PlusCircle className="w-5 h-5" /><span>Book Appointment</span></button>
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <div className="mb-4 px-4 py-3 bg-slate-800/50 rounded-xl overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{dashboardData.patient_name}</p>
                        <p className="text-xs text-slate-400 truncate">{dashboardData.email}</p>
                    </div>
                    <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-full flex items-center space-x-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl"><LogOut className="w-5 h-5" /><span>Logout</span></button>
                </div>
            </aside>

            {/* MAIN */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                {successMsg && <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl z-[100] animate-in fade-in slide-in-from-top-4">{successMsg}</div>}

                {activeTab === 'overview' && (
                    <div className="space-y-10">
                        <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden">
                            <h1 className="text-4xl font-black mb-2">Hello, {dashboardData.patient_name.split(' ')[0]}!</h1>
                            <p className="opacity-80">Track your healing journey and manage specialists.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <h2 className="text-2xl font-black flex items-center text-slate-900 dark:text-white"><Calendar className="w-6 h-6 mr-2 text-blue-600" /> Appointments</h2>
                                <div className="space-y-4">
                                    {dashboardData.appointments.map(apt => (
                                        <div key={apt.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                            <div>
                                                <span className="text-[10px] font-black uppercase px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-md">{apt.status}</span>
                                                <h3 className="text-xl font-bold mt-2 dark:text-white">Dr. {apt.doctor_name}</h3>
                                                <p className="text-sm text-slate-500 mb-4">{apt.reason}</p>
                                                {apt.date_time && <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {new Date(apt.date_time).toLocaleString()}</p>}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {apt.status === 'Scheduled' && <button onClick={() => setChatModal({ isOpen: true, apt })} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all">Open Chat</button>}
                                                {apt.status === 'Scheduled' && <button onClick={() => setIsRescheduleModalOpen(true)} className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-xs font-bold rounded-xl hover:bg-amber-100 transition-all">Reschedule</button>}
                                                {apt.status === 'Negotiating' && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleRespondNegotiation(apt.id, true)} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">Accept Slot</button>
                                                        <button onClick={() => handleRespondNegotiation(apt.id, false)} className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl">Decline</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-2xl font-black flex items-center text-slate-900 dark:text-white"><FileText className="w-6 h-6 mr-2 text-emerald-600" /> Vault</h2>
                                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {displayedRecords.map(rec => (
                                            <div key={rec.id} className="p-5 flex items-center justify-between group">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5" /></div>
                                                    <div><p className="text-sm font-bold dark:text-white">{rec.record_type}</p><p className="text-[10px] text-slate-400">{new Date(rec.uploaded_at).toLocaleDateString()}</p></div>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <button onClick={() => setViewRecord(rec)} className="p-2 text-slate-300 hover:text-emerald-600 transition-colors" title="View"><Eye className="w-5 h-5" /></button>
                                                    <button onClick={() => handleDeleteRecord(rec.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors" title="Delete"><Trash2 className="w-5 h-5" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => setIsUploadModalOpen(true)} className="w-full py-4 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-emerald-600 hover:bg-emerald-50 transition-colors">+ Add New Record</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'prescriptions' && (
                    <div className="space-y-8 animate-in fade-in">
                        <h1 className="text-3xl font-black dark:text-white">e-Prescriptions</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {dashboardData.prescriptions.map(rx => (
                                <div key={rx.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative group">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div><h3 className="text-xl font-bold dark:text-white">Dr. {rx.doctor_name}</h3><p className="text-xs text-slate-400 font-bold uppercase">{new Date(rx.date).toLocaleDateString()}</p></div>
                                        <button onClick={() => setRxModal({ isOpen: true, data: rx })} className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Printer className="w-5 h-5" /></button>
                                    </div>
                                    <div className="space-y-2">{rx.medicines.map((m, i) => (<div key={i} className="text-sm font-bold text-slate-700 dark:text-slate-300">• {m.name} <span className="text-[10px] opacity-50 ml-2">{m.dosage}</span></div>))}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* --- MODALS --- */}
            
            {/* BOOKING MODAL */}
            {isBookingModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative">
                        <button onClick={() => setIsBookingModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 rounded-full"><X className="w-6 h-6" /></button>
                        <h2 className="text-2xl font-black mb-6 dark:text-white">Book a Specialist</h2>
                        <form onSubmit={handleBookAppointment} className="space-y-5">
                            <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Physician</label><select required value={bookingForm.doctor_id} onChange={(e) => setBookingForm({ ...bookingForm, doctor_id: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white"><option value="">-- Select --</option>{dashboardData.available_doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialty})</option>)}</select></div>
                            <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Reason</label><input required type="text" value={bookingForm.reason} onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white" /></div>
                            <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-900/20">Send Request</button>
                        </form>
                    </div>
                </div>
            )}

            {/* CHAT MODAL */}
            {chatModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-blue-50/30 dark:bg-blue-900/10">
                            <h2 className="text-lg font-bold dark:text-white">Chat with Dr. {chatModal.apt.doctor_name}</h2>
                            <button onClick={() => setChatModal({ isOpen: false, apt: null })} className="p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-full"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                            {messages.map((m, i) => {
                                const isMe = m.sender_id !== chatModal.apt.doctor_id;
                                return (
                                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm'}`}>{m.content}</div>
                                    </div>
                                );
                            })}
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-3">
                            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none dark:text-white" />
                            <button type="submit" className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700"><Send className="w-5 h-5" /></button>
                        </form>
                    </div>
                </div>
            )}

            {/* RESCHEDULE MODAL */}
            {isRescheduleModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative">
                        <button onClick={() => setIsRescheduleModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 rounded-full"><X className="w-6 h-6" /></button>
                        <h2 className="text-2xl font-black mb-6 dark:text-white text-center">Change Schedule</h2>
                        <form onSubmit={handleRescheduleRequest} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest text-center">Select New Date</label>
                                <input required type="date" value={rescheduleForm.date} onChange={e => setRescheduleForm({...rescheduleForm, date: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-[1.5rem] dark:text-white text-center font-bold text-lg" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest text-center">Select Preferred Slot</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Morning', 'Afternoon', 'Evening'].map(s => (
                                        <button 
                                            key={s} type="button" 
                                            onClick={() => setRescheduleForm({...rescheduleForm, slot: s})}
                                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter border-2 transition-all ${rescheduleForm.slot === s ? 'bg-amber-500 border-amber-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-900/20 flex items-center justify-center">
                                <Send className="w-4 h-4 mr-2" /> Request Change
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* UPLOAD MODAL */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800">
                        <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        <h2 className="text-2xl font-black mb-6 dark:text-white">Upload Record</h2>
                        <form onSubmit={handleUploadRecord} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Record Type</label>
                                <select required value={uploadForm.record_type} onChange={(e) => setUploadForm({ ...uploadForm, record_type: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                                    <option value="Lab Report">Lab Report</option>
                                    <option value="Prescription">Prescription</option>
                                    <option value="MRI/Scan">MRI/Scan</option>
                                    <option value="Vaccination">Vaccination</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Description</label>
                                <input required type="text" value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Recent Blood Test" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Select File</label>
                                <input required type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-emerald-50 file:text-emerald-700" />
                            </div>
                            <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-900/20 flex items-center justify-center transition-all uppercase tracking-widest text-xs">
                                <Upload className="w-4 h-4 mr-2" /> Upload to Vault
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Rx VIEWER MODAL */}
            {rxModal.isOpen && rxModal.data && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[130] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="bg-slate-50 p-4 border-b flex justify-between items-center no-print">
                            <button onClick={printPrescription} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center shadow-lg"><Printer className="w-4 h-4 mr-2" /> Print PDF</button>
                            <button onClick={() => setRxModal({ isOpen: false, data: null })} className="p-2 text-slate-400 hover:text-rose-500 rounded-full"><X className="w-6 h-6" /></button>
                        </div>
                        <div id="printable-rx" className="p-12 bg-white text-slate-800">
                            <div className="flex justify-between items-start border-b-2 border-blue-600 pb-6 mb-8">
                                <div><h1 className="text-3xl font-black text-blue-600 tracking-tighter">HealNexus</h1><p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Digital Health Network</p></div>
                                <div className="text-right"><p className="font-black text-lg">Dr. {rxModal.data.doctor_name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Medical License: HEAL-TX-{rxModal.data.id + 1000}</p></div>
                            </div>
                            <div className="mb-10"><p className="text-[10px] font-black uppercase text-slate-400 mb-2">Patient Details</p><p className="text-xl font-bold">{dashboardData.patient_name}</p><p className="text-sm text-slate-500">Issued On: {new Date(rxModal.data.date).toLocaleDateString()}</p></div>
                            <div className="mb-10"><p className="text-[10px] font-black uppercase text-slate-400 mb-4 border-b border-slate-100 pb-2">Rx: Medication & Dosage</p><div className="space-y-6">{rxModal.data.medicines.map((m, i) => (<div key={i} className="flex items-start"><div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-4 mt-1 font-bold text-xs">Rx</div><div><p className="font-bold text-lg">{m.name}</p><p className="text-blue-600 font-bold text-sm">{m.dosage} — {m.frequency}</p><p className="text-xs text-slate-400 font-medium">Duration: {m.duration}</p></div></div>))}</div></div>
                            <div className="text-center mt-20 pt-8 border-t border-slate-100"><p className="font-black mb-1">Digitally Signed by Dr. {rxModal.data.doctor_name}</p><p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">HealNexus Consultation Platform &copy; 2026</p></div>
                        </div>
                    </div>
                </div>
            )}

            {/* VAULT VIEWER MODAL */}
            {viewRecord && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[140] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <div><h2 className="text-xl font-bold dark:text-white">{viewRecord.record_type}</h2><p className="text-sm text-slate-500">{viewRecord.description}</p></div>
                            <button onClick={() => setViewRecord(null)} className="p-2 text-slate-400 hover:text-rose-500 rounded-full"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 flex items-center justify-center">
                            {viewRecord.file_path.match(/\.(jpeg|jpg|png)$/i) ? <img src={`${API_BASE_URL}/${viewRecord.file_path}`} className="max-w-full max-h-full object-contain rounded-xl" /> : <iframe src={`${API_BASE_URL}/${viewRecord.file_path}`} className="w-full h-full rounded-xl bg-white" title="Viewer" />}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
