import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import AnimatedLogo from '../../components/common/AnimatedLogo';

export default function Register() {
    const navigate = useNavigate();
    const [role, setRole] = useState('patient');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState(''); // <--- NEW STATE FOR SUCCESS

    const [formData, setFormData] = useState({
        full_name: '', email: '', password: '', confirmPassword: '',
        age: '', gender: '', phone: '', specialization: '', license_no: '',
        secondary_mobile: ''
    });
    const [applicationFile, setApplicationFile] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setApplicationFile(e.target.files[0]);
    };

    const calculateStrength = (pass) => {
        let strength = 0;
        if (pass.length > 5) strength += 1;
        if (pass.length > 8) strength += 1;
        if (/[A-Z]/.test(pass)) strength += 1;
        if (/[0-9]/.test(pass)) strength += 1;
        if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
        return strength;
    };
    const passwordStrength = calculateStrength(formData.password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg(''); // Clear old success messages

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (role === 'doctor' && !applicationFile) {
            setError('Please upload your qualification document (PDF/Image).');
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('full_name', formData.full_name);
            data.append('email', formData.email);
            data.append('password', formData.password);
            data.append('role', role);
            
            if (role === 'patient') {
                if (formData.age) data.append('age', formData.age);
                if (formData.gender) data.append('gender', formData.gender);
                if (formData.phone) data.append('phone', formData.phone);
            } else if (role === 'doctor') {
                if (formData.specialization) data.append('specialization', formData.specialization);
                if (formData.license_no) data.append('license_no', formData.license_no);
                if (formData.secondary_mobile) data.append('secondary_mobile', formData.secondary_mobile);
                if (applicationFile) data.append('application_doc', applicationFile);
            }

            await api.post('/auth/register', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // --- NEW: Dynamic Success Message ---
            if (role === 'patient') {
                setSuccessMsg('Successfully created Patient user. Redirecting to login...');
            } else {
                setSuccessMsg('Account created! Waiting for Admin approval. Redirecting...');
            }

            // --- NEW: 3-Second Delay before Redirect ---
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
            setLoading(false); // Only stop loading if there's an error so the button doesn't flicker
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020817] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-500">
            <div className="mb-6 flex items-center justify-center mt-12 md:mt-0">
                <AnimatedLogo />
            </div>

            <Link
                to="/"
                className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>

            <Link
                to="/login"
                className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
                Back to Login Page <ArrowRight className="w-4 h-4 ml-2" />
            </Link>

            <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-colors">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Create an Account</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 transition-colors">Join our digital healthcare ecosystem.</p>
                </div>

                {/* Role Selector Tabs */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-8 transition-colors">
                    {['patient', 'doctor', 'admin'].map((r) => (
                        <button
                            key={r} type="button" onClick={() => setRole(r)}
                            disabled={successMsg !== ''} // Disable switching roles while redirecting
                            className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all ${role === r ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>

                {/* ERROR BANNER */}
                {error && <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded border-l-4 border-red-500 transition-colors">{error}</div>}

                {/* SUCCESS BANNER */}
                {successMsg && (
                    <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm rounded-lg border border-emerald-200 dark:border-emerald-800 font-bold flex items-center animate-in fade-in transition-colors">
                        <CheckCircle className="w-5 h-5 mr-2 shrink-0" />
                        {successMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">Full Name</label>
                            <input name="full_name" type="text" required value={formData.full_name} onChange={handleChange} disabled={successMsg !== ''} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-50 dark:text-white transition-colors" placeholder="John Doe" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">Email Address</label>
                            <input name="email" type="email" required value={formData.email} onChange={handleChange} disabled={successMsg !== ''} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-50 dark:text-white transition-colors" placeholder="john@example.com" />
                        </div>
                    </div>

                    {/* Dynamic Fields based on Role */}
                    {role === 'patient' && (
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 transition-colors">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">Age</label>
                                <input name="age" type="number" value={formData.age} onChange={handleChange} disabled={successMsg !== ''} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none disabled:opacity-50 dark:text-white transition-colors" placeholder="e.g. 34" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} disabled={successMsg !== ''} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none disabled:opacity-50 dark:text-white transition-colors">
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {role === 'doctor' && (
                        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 transition-colors">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">Specialization</label>
                                    <input name="specialization" type="text" value={formData.specialization} onChange={handleChange} disabled={successMsg !== ''} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none disabled:opacity-50 dark:text-white transition-colors" placeholder="e.g. Cardiology" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">License No.</label>
                                    <input name="license_no" type="text" value={formData.license_no} onChange={handleChange} disabled={successMsg !== ''} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none disabled:opacity-50 dark:text-white transition-colors" placeholder="MED-12345" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">Secondary Mobile (Optional)</label>
                                    <input name="secondary_mobile" type="tel" value={formData.secondary_mobile} onChange={handleChange} disabled={successMsg !== ''} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-50 dark:text-white transition-colors" placeholder="+880..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">Qualification PDF/Image (Mandatory)</label>
                                <input 
                                    type="file" 
                                    accept=".pdf,.jpg,.jpeg,.png" 
                                    onChange={handleFileChange} 
                                    disabled={successMsg !== ''} 
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-600 dark:file:text-blue-400 hover:file:bg-blue-100 dark:text-white transition-colors" 
                                />
                                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tight">Upload all certificates in a single PDF or Image.</p>
                            </div>
                        </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 transition-colors">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">Password</label>
                        <input name="password" type="password" required value={formData.password} onChange={handleChange} disabled={successMsg !== ''} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-50 dark:text-white transition-colors" placeholder="••••••••" />
                        {formData.password && (
                            <div className="mt-2 flex gap-1">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <div key={level} className={`h-1.5 w-full rounded-full ${level <= passwordStrength ? (passwordStrength > 3 ? 'bg-green-500' : passwordStrength > 2 ? 'bg-yellow-400' : 'bg-red-400') : 'bg-slate-200 dark:bg-slate-700'}`} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">Confirm Password</label>
                        <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} disabled={successMsg !== ''} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-50 dark:text-white transition-colors" placeholder="••••••••" />
                    </div>

                    <button type="submit" disabled={loading || successMsg !== ''} className={`w-full flex justify-center items-center px-4 py-3 text-white text-sm font-semibold rounded-lg transition-all ${loading || successMsg !== '' ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'}`}>
                        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {successMsg ? 'Redirecting...' : 'Creating account...'}</> : 'Create Account'}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 transition-colors">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                        Log in here
                    </Link>
                </p>
            </div>
        </div>
    );
}