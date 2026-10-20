import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import AnimatedLogo from '../../components/common/AnimatedLogo';

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });

    useEffect(() => {
        const queryToken = new URLSearchParams(location.search).get('token');
        if (!queryToken) {
            setError('Missing reset token. Please request a new link.');
        } else {
            setToken(queryToken);
        }
    }, [location]);

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
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/reset-password', {
                token,
                new_password: formData.password
            });
            setMessage(response.data.message);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020817] flex flex-col items-center justify-center px-4 transition-colors duration-500">
            <div className="mb-8"><AnimatedLogo /></div>

            <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Create New Password</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Your new password must be different from previous ones.</p>

                {message && (
                    <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm rounded-lg border border-emerald-200 dark:border-emerald-800 font-bold flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {message} Redirecting to login...
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800 flex items-center font-medium">
                        <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                        {error}
                    </div>
                )}

                {token && !message && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>
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
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className={`w-full flex justify-center items-center px-4 py-3 text-white text-sm font-bold rounded-xl transition-all ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}>
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Reset Password'}
                        </button>
                    </form>
                )}

                {!token && (
                    <Link to="/forgot-password" className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700">
                        Request New Link
                    </Link>
                )}
            </div>
        </div>
    );
}
