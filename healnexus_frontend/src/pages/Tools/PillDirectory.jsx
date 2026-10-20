import { useState, useEffect } from 'react';
import { 
    Search, ArrowLeft, Info, AlertTriangle, ChevronDown, ChevronUp, 
    ArrowDown, Activity, FileText, UserPlus, Pill, X, Stethoscope,
    Loader2, Database, ShieldCheck, HelpCircle, PlusCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function PillDirectory() {
    const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'assessor'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLetter, setSelectedLetter] = useState('All');
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedPill, setExpandedPill] = useState(null);
    const [alternatives, setAlternatives] = useState({});
    
    // Symptom Assessor States
    const [symptoms, setSymptoms] = useState([]);
    const [currentSymptom, setCurrentSymptom] = useState('');
    const [assessedMeds, setAssessedMeds] = useState([]);
    const [assessing, setAssessing] = useState(false);

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    // --- 1. SEARCH MEDICINES ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length >= 2) {
                fetchMedicines();
            } else if (searchTerm.length === 0) {
                setMedicines([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchMedicines = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/medical/search?query=${searchTerm}`);
            setMedicines(response.data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setLoading(false);
        }
    };

    // --- 2. GET ALTERNATIVES ---
    const fetchAlternatives = async (pillId) => {
        if (alternatives[pillId]) return; // Already fetched
        try {
            const response = await api.get(`/medical/alternatives/${pillId}`);
            setAlternatives(prev => ({ ...prev, [pillId]: response.data }));
        } catch (err) {
            console.error("Failed to fetch alternatives", err);
        }
    };

    const toggleExpand = (pillId) => {
        if (expandedPill === pillId) {
            setExpandedPill(null);
        } else {
            setExpandedPill(pillId);
            fetchAlternatives(pillId);
        }
    };

    // --- 3. SYMPTOM ASSESSOR LOGIC ---
    const addSymptom = (e) => {
        e.preventDefault();
        if (currentSymptom.trim() && !symptoms.includes(currentSymptom.trim())) {
            setSymptoms([...symptoms, currentSymptom.trim()]);
            setCurrentSymptom('');
        }
    };

    const removeSymptom = (sym) => {
        setSymptoms(symptoms.filter(s => s !== sym));
    };

    const handleAssess = async () => {
        if (symptoms.length === 0) return;
        setAssessing(true);
        try {
            const response = await api.post('/medical/symptom-assessment', {
                symptoms: symptoms.join(',')
            });
            setAssessedMeds(response.data);
        } catch (err) {
            console.error("Assessment failed", err);
        } finally {
            setAssessing(false);
        }
    };

    const isLoggedIn = !!localStorage.getItem('token');
    const role = localStorage.getItem('role') || 'patient';
    const backRoute = isLoggedIn ? `/${role}` : '/';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020817] p-4 md:p-12 relative font-sans transition-colors duration-500">
            <div className="max-w-5xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                    <div className="flex items-center">
                        <Link to={backRoute} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mr-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">Medicine Intel</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Search, verify, and find cost-effective alternatives</p>
                        </div>
                    </div>

                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl w-fit transition-colors">
                        <button 
                            onClick={() => setActiveTab('directory')}
                            className={`flex items-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'directory' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                        >
                            <Pill className="w-4 h-4 mr-2" /> Pill Directory
                        </button>
                        <button 
                            onClick={() => setActiveTab('assessor')}
                            className={`flex items-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'assessor' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                        >
                            <Stethoscope className="w-4 h-4 mr-2" /> Symptom Assessor
                        </button>
                    </div>
                </div>

                {/* Medical Disclaimer Banner */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 p-6 rounded-3xl shadow-sm mb-10 flex items-start transition-colors">
                    <div className="p-3 bg-amber-100 dark:bg-amber-800 rounded-2xl mr-4 shrink-0">
                        <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-amber-900 dark:text-amber-400 font-extrabold text-lg mb-1">Critical Medical Disclaimer</h3>
                        <p className="text-amber-800 dark:text-amber-300 text-sm leading-relaxed font-medium">
                            This tool is for <strong>informational purposes only</strong>. It is NOT a substitute for professional medical advice, diagnosis, or treatment. 
                            Never ignore professional medical advice because of something you read here. If you are experiencing a medical emergency, please call your local emergency services immediately.
                        </p>
                    </div>
                </div>

                {/* --- TAB 1: PILL DIRECTORY --- */}
                {activeTab === 'directory' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="relative mb-10">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                <Search className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search 20,000+ brands (e.g. Napa, Seclo, Fexo)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-lg font-medium text-slate-800 dark:text-slate-200"
                            />
                            {loading && (
                                <div className="absolute inset-y-0 right-0 pr-6 flex items-center">
                                    <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
                                </div>
                            )}
                        </div>

                        {medicines.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6">
                                {medicines.map((pill) => (
                                    <div key={pill.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all">
                                        <div 
                                            onClick={() => toggleExpand(pill.id)}
                                            className="p-6 cursor-pointer flex justify-between items-center group"
                                        >
                                            <div className="flex items-center">
                                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                                                    <Pill className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight transition-colors">{pill.brand_name}</h3>
                                                    <div className="flex items-center mt-1 space-x-3">
                                                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800 transition-colors">{pill.generic?.name}</span>
                                                        <span className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest transition-colors">{pill.strength}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {expandedPill === pill.id ? <ChevronUp className="w-6 h-6 text-slate-300 dark:text-slate-600" /> : <ChevronDown className="w-6 h-6 text-slate-300 dark:text-slate-600" />}
                                        </div>

                                        {expandedPill === pill.id && (
                                            <div className="px-6 pb-8 pt-2 animate-in slide-in-from-top-4 duration-300 border-t border-slate-50 dark:border-slate-800">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                                    <div className="space-y-6">
                                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors">
                                                            <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                                                                <Info className="w-4 h-4 mr-2 text-blue-500" /> Medicine Details
                                                            </h4>
                                                            <div className="space-y-3">
                                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Manufacturer: <span className="text-slate-500 dark:text-slate-400 font-medium">{pill.manufacturer?.name}</span></p>
                                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Form: <span className="text-slate-500 dark:text-slate-400 font-medium">{pill.dosage_form?.name}</span></p>
                                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Class: <span className="text-slate-500 dark:text-slate-400 font-medium">{pill.drug_class?.name}</span></p>
                                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Price: <span className="text-emerald-600 dark:text-emerald-400 font-black">à§³ {pill.price}</span></p>
                                                            </div>
                                                        </div>

                                                        <div className="bg-blue-600 p-5 rounded-3xl text-white shadow-lg shadow-blue-200 dark:shadow-none transition-colors">
                                                            <h4 className="text-xs font-black text-blue-200 uppercase tracking-widest mb-3 flex items-center">
                                                                <ShieldCheck className="w-4 h-4 mr-2" /> Indications (Uses)
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {pill.generic?.indications?.map((ind, i) => (
                                                                    <span key={i} className="px-3 py-1 bg-white/10 rounded-lg text-sm font-bold backdrop-blur-sm border border-white/10">
                                                                        {ind.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                                                            <Database className="w-4 h-4 mr-2 text-purple-500" /> Brand Alternatives
                                                        </h4>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {alternatives[pill.id] ? (
                                                                alternatives[pill.id].map((alt, idx) => (
                                                                    <div key={idx} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 text-center hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-default">
                                                                        {alt.brand_name}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="col-span-2 flex items-center justify-center py-4">
                                                                    <Loader2 className="w-5 h-5 text-slate-300 dark:text-slate-600 animate-spin" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[40px] border-4 border-dashed border-slate-100 dark:border-slate-800 transition-colors">
                                <Search className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-slate-400 dark:text-slate-600">Find your medicine...</h3>
                                <p className="text-slate-300 dark:text-slate-700 font-bold mt-2">Type a brand name like "Napa" to get started.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- TAB 2: SYMPTOM ASSESSOR --- */}
                {activeTab === 'assessor' && (
                    <div className="animate-in slide-in-from-right-10 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            
                            {/* Input Panel */}
                            <div className="lg:col-span-1 space-y-8">
                                <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 transition-colors">
                                    <div className="flex items-center mb-6">
                                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 rounded-2xl mr-4 transition-colors">
                                            <Activity className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white transition-colors">Symptom Input</h3>
                                    </div>

                                    <form onSubmit={addSymptom} className="relative mb-6">
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Fever, Headache..."
                                            value={currentSymptom}
                                            onChange={(e) => setCurrentSymptom(e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-rose-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                                        />
                                        <button type="submit" className="absolute right-3 top-3 p-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors">
                                            <PlusCircle className="w-5 h-5" />
                                        </button>
                                    </form>

                                    <div className="flex flex-wrap gap-2 mb-8 min-h-[100px] p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 transition-colors">
                                        {symptoms.length > 0 ? symptoms.map((s, i) => (
                                            <span key={i} className="flex items-center px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold animate-in zoom-in transition-colors">
                                                {s} <X onClick={() => removeSymptom(s)} className="w-4 h-4 ml-2 cursor-pointer hover:scale-125 transition-transform" />
                                            </span>
                                        )) : (
                                            <p className="text-slate-300 dark:text-slate-600 text-sm font-bold m-auto transition-colors">No symptoms added</p>
                                        )}
                                    </div>

                                    <button 
                                        onClick={handleAssess}
                                        disabled={symptoms.length === 0 || assessing}
                                        className="w-full py-5 bg-rose-600 text-white rounded-3xl font-black text-lg shadow-lg shadow-rose-200 dark:shadow-none hover:bg-rose-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 transition-all flex items-center justify-center"
                                    >
                                        {assessing ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Stethoscope className="w-6 h-6 mr-2" />}
                                        Run Assessment
                                    </button>
                                </div>

                                <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-xl shadow-blue-200 dark:shadow-none transition-colors">
                                    <HelpCircle className="w-10 h-10 text-blue-200 mb-4" />
                                    <h4 className="text-xl font-black mb-2">How it works?</h4>
                                    <p className="text-blue-100 text-sm leading-relaxed font-medium">
                                        Our intelligence engine maps your symptoms to medical indications, then finds Over-The-Counter (OTC) generics and popular brands proven to treat those conditions.
                                    </p>
                                </div>
                            </div>

                            {/* Results Panel */}
                            <div className="lg:col-span-2">
                                {assessedMeds.length > 0 ? (
                                    <div className="space-y-6">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center transition-colors">
                                            <ShieldCheck className="w-8 h-8 mr-3 text-emerald-500" /> Recommended OTC Intel
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {assessedMeds.map((med) => (
                                                <div key={med.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-700 transition-all group">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:rotate-12 transition-all">
                                                            <Pill className="w-6 h-6" />
                                                        </div>
                                                        <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded tracking-widest uppercase transition-colors">{med.dosage_form?.name}</span>
                                                    </div>
                                                    <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase transition-colors">{med.brand_name}</h4>
                                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-4 transition-colors">{med.generic?.name}</p>
                                                    
                                                    <div className="pt-4 border-t border-slate-50 dark:border-slate-800 transition-colors">
                                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 transition-colors">Treats conditions like:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {med.generic?.indications?.slice(0, 2).map((ind, i) => (
                                                                <span key={i} className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg italic transition-colors">
                                                                    {ind.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-[40px] border-4 border-dashed border-slate-100 dark:border-slate-800 text-center px-10 transition-colors">
                                        <Stethoscope className="w-20 h-20 text-slate-100 dark:text-slate-800 mb-6 transition-colors" />
                                        <h3 className="text-2xl font-black text-slate-300 dark:text-slate-700 transition-colors">Awaiting Assessment</h3>
                                        <p className="text-slate-200 dark:text-slate-600 font-bold max-w-sm mt-2 transition-colors">Add your symptoms on the left and click 'Run Assessment' to see matching OTC intelligence.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
