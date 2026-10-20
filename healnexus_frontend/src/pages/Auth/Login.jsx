import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import AnimatedLogo from '../../components/common/AnimatedLogo';
import { useTheme } from '../../context/ThemeContext';

export default function Login() {
    const navigate = useNavigate();
    const { setTheme } = useTheme();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', formData);

            // 1. Normalize the role to ensure it matches perfectly
            const userRole = String(response.data.role).toLowerCase().trim();

            // 2. CRITICAL FIX: Save BOTH the token AND the role!
            // ProtectedRoute needs the role to know you are allowed in.
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('role', userRole);

            if (response.data.theme) {
                setTheme(response.data.theme);
            }

            // 3. Route the user to their specific dashboard
            if (userRole === 'doctor') {
                navigate('/doctor');
            } else if (userRole === 'patient') {
                navigate('/'); // Redirect to Home Page as requested
            } else if (userRole === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }

        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020817] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 transition-colors duration-500">

            <Link
                to="/"
                className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>

            <div className="mb-8 flex items-center justify-center">
                <AnimatedLogo />
            </div>

            <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-colors">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">Welcome back</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 transition-colors">Please enter your details to sign in.</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm rounded transition-colors">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all dark:text-white"
                            placeholder="Enter your email"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">Password</label>
                            <Link to="/forgot-password" size="sm" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        <input
                            name="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all dark:text-white"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center items-center px-4 py-3 text-white text-sm font-bold rounded-xl transition-all ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'}`}
                    >
                        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</> : 'Sign in'}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 transition-colors">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}