import { useState } from 'react';
import { 
    Search, ArrowLeft, Info, AlertTriangle, ChevronRight, 
    Activity, FileText, UserPlus, Pill, Stethoscope,
    Loader2, ShieldCheck, HelpCircle, Thermometer,
    Wind, Droplets, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const CATEGORIES = [
    { id: 'stomach', name: 'Stomach & Digestion', icon: Droplets, color: 'text-emerald-500', bg: 'bg-emerald-50', symptoms: ['Acidity', 'Gastric', 'Diarrhea', 'Vomiting', 'Constipation', 'Abdominal Pain'] },
    { id: 'pain', name: 'Pain & Fever', icon: Thermometer, color: 'text-rose-500', bg: 'bg-rose-50', symptoms: ['Fever', 'Headache', 'Body Ache', 'Joint Pain', 'Migraine', 'Muscle Pain'] },
    { id: 'respiratory', name: 'Respiratory & Cold', icon: Wind, color: 'text-blue-500', bg: 'bg-blue-50', symptoms: ['Cough', 'Runny Nose', 'Sneezing', 'Asthma', 'Sore Throat', 'Allergy'] },
    { id: 'skin', name: 'Skin & Allergy', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', symptoms: ['Itching', 'Skin Rash', 'Hives', 'Fungal Infection', 'Eczema'] },
];

export default function CommonPrescriptions() {
    const [step, setStep] = useState(1); // 1: Category, 2: Symptom, 3: Profile
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSymptom, setSelectedSymptom] = useState('');
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleCategorySelect = (cat) => {
        setSelectedCategory(cat);
        setStep(2);
    };

    const handleSymptomSelect = async (sym) => {
        setSelectedSymptom(sym);
        setStep(3);
        setLoading(true);
        try {
            const response = await api.get(`/medical/guided-triage?symptom=${sym}`);
            setProfiles(response.data);
        } catch (err) {
            console.error("Triage failed", err);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep(1);
        setSelectedCategory(null);
        setSelectedSymptom('');
        setProfiles([]);
    };

    const isLoggedIn = !!localStorage.getItem('token');
    const role = localStorage.getItem('role') || 'patient';
    const backRoute = isLoggedIn ? `/${role}` : '/';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020817] p-4 md:p-12 relative font-sans transition-colors duration-500">
            <div className="max-w-5xl mx-auto">
                
                {/* Header */}
                <div className="flex items-center mb-8">
                    <button onClick={step === 1 ? null : step === 2 ? () => setStep(1) : () => setStep(2)} 
                            className={`p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mr-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${step === 1 ? 'opacity-0 cursor-default' : ''}`}>
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">Guided Triage</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Safe OTC guidance for common ailments</p>
                    </div>
                </div>

                {/* Medical Disclaimer */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 p-5 rounded-3xl shadow-sm mb-10 flex items-start transition-colors">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mr-3 shrink-0 mt-0.5" />
                    <p className="text-amber-800 dark:text-amber-400 text-xs leading-relaxed font-bold">
                        DISCLAIMER: This tool provides general guidance for common ailments. 
                        It is NOT a professional prescription. If symptoms persist more than 48 hours, or if you feel severe distress, 
                        consult a doctor immediately.
                    </p>
                </div>

                {/* --- STEP 1: CATEGORY SELECTION --- */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 uppercase tracking-widest transition-colors">Step 1: Where is the discomfort?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {CATEGORIES.map((cat) => (
                                <button 
                                    key={cat.id}
                                    onClick={() => handleCategorySelect(cat)}
                                    className="flex items-center p-8 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[32px] hover:border-blue-500 dark:hover:border-blue-700 hover:shadow-xl hover:shadow-blue-500/10 transition-all group text-left"
                                >
                                    <div className={`p-5 ${cat.bg} dark:bg-slate-800 ${cat.color} rounded-2xl mr-6 group-hover:scale-110 transition-transform`}>
                                        <cat.icon className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white transition-colors">{cat.name}</h3>
                                        <p className="text-slate-400 dark:text-slate-500 text-sm font-bold transition-colors">Find remedies for {cat.symptoms[0]}, {cat.symptoms[1]}...</p>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-slate-300 dark:text-slate-700 group-hover:text-blue-500 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- STEP 2: SYMPTOM SELECTION --- */}
                {step === 2 && selectedCategory && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 uppercase tracking-widest transition-colors">Step 2: Select your specific symptom</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {selectedCategory.symptoms.map((sym) => (
                                <button 
                                    key={sym}
                                    onClick={() => handleSymptomSelect(sym)}
                                    className="p-6 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl hover:border-blue-500 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 font-black text-lg transition-all shadow-sm"
                                >
                                    {sym}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- STEP 3: RESULTS (PROFILES) --- */}
                {step === 3 && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest transition-colors">Recommended Intel for: <span className="text-blue-600 dark:text-blue-400">{selectedSymptom}</span></h2>
                            <button onClick={reset} className="text-sm font-black text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">Start Over</button>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                                <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
                                <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest transition-colors">Analyzing Medical Data...</p>
                            </div>
                        ) : profiles.length > 0 ? (
                            <div className="space-y-8">
                                {profiles.map((profile, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-black/20 transition-colors">
                                        <div className="p-8 md:p-12">
                                            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                                                <div>
                                                    <span className="inline-block px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest mb-4">Recommended Generic</span>
                                                    <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">{profile.generic.name}</h3>
                                                </div>
                                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 max-w-sm transition-colors">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                                                        <Zap className="w-3 h-3 mr-1.5 text-blue-500" /> Dosage Guideline
                                                    </h4>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed transition-colors">{profile.dosage_guideline}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                {/* Left: Side Effects */}
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center transition-colors">
                                                        <Activity className="w-5 h-5 mr-3 text-rose-500" /> Potential Side Effects
                                                    </h4>
                                                    <div className="bg-rose-50/50 dark:bg-rose-900/10 p-8 rounded-[32px] border border-rose-100 dark:border-rose-900/30 transition-colors">
                                                        <p className="text-rose-900 dark:text-rose-300 text-sm font-medium leading-relaxed italic transition-colors">
                                                            {profile.generic.side_effects || "No specific side effects reported for this OTC component in current database. Always monitor for reactions."}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Right: Bangladeshi Brands */}
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center transition-colors">
                                                        <Pill className="w-5 h-5 mr-3 text-emerald-500" /> Available BD Brands
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {profile.top_brands.map((brand, idx) => (
                                                            <div key={idx} className="p-5 bg-white dark:bg-slate-800/50 border-2 border-slate-50 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center group hover:border-blue-500 dark:hover:border-blue-700 transition-all">
                                                                <span className="text-lg font-black text-slate-900 dark:text-white uppercase group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{brand.brand_name}</span>
                                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest transition-colors">{brand.dosage_form?.name || 'Tablet'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-slate-900 dark:bg-black/40 p-6 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
                                            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold transition-colors">Safe for General Adult use. Ensure no known allergies to {profile.generic.name}.</p>
                                            <Link to="/doctors" className="flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold backdrop-blur-md transition-all">
                                                <UserPlus className="w-4 h-4 mr-2" /> Book Professional Consult
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border-4 border-dashed border-slate-100 dark:border-slate-800 transition-colors">
                                <Stethoscope className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-slate-300 dark:text-slate-700 transition-colors">No profile found</h3>
                                <p className="text-slate-200 dark:text-slate-800 font-bold mt-2 transition-colors">Try a different symptom or consult a professional.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Nav */}
                <div className="mt-16 text-center">
                    <Link to={backRoute} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm flex items-center justify-center transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Intelligence Dashboard
                    </Link>
                </div>

            </div>
        </div>
    );
}
