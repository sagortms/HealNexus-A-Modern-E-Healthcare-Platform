import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import AnimatedLogo from '../../components/common/AnimatedLogo';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [resetToken, setResetToken] = useState(''); // Only for dev demo

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await api.post('/auth/forgot-password', { email });
            setMessage(response.data.message);
            if (response.data.reset_token) {
                setResetToken(response.data.reset_token);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020817] flex flex-col items-center justify-center px-4 transition-colors duration-500">
            <Link to="/login" className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </Link>

            <div className="mb-8"><AnimatedLogo /></div>

            <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-colors">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Reset Password</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enter your email and we'll send you a link to reset your password.</p>

                {message && (
                    <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-start animate-in fade-in">
                        <CheckCircle className="w-5 h-5 mr-2 shrink-0" />
                        <div>
                            <p className="font-bold">{message}</p>
                            {resetToken && (
                                <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded border border-emerald-200 dark:border-emerald-800">
                                    <p className="text-xs font-bold uppercase mb-1">Dev Demo Reset Link:</p>
                                    <Link to={`/reset-password?token=${resetToken}`} className="text-blue-600 dark:text-blue-400 break-all hover:underline font-mono text-[10px]">
                                        Click here to Reset
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded border-l-4 border-red-500">{error}</div>}

                {!message && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none dark:text-white"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className={`w-full flex justify-center items-center px-4 py-3 text-white text-sm font-bold rounded-xl transition-all ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}>
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Send Reset Link'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
