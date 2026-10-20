import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, HeartPulse } from 'lucide-react';
import api from '../../services/api'; // Our custom Axios client


export default function Login() {
    const navigate = useNavigate();
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
            // POST to our FastAPI backend
            const response = await api.post('/auth/login', formData);

            // 1. Normalize the role string just in case
            const userRole = String(response.data.role).toLowerCase().trim();

            // 2. Save BOTH the JWT token AND the role!
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('role', userRole); // ProtectedRoute needs this!

            // 3. Route the user
            if (userRole === 'patient') navigate('/patient');
            else if (userRole === 'doctor') navigate('/doctor');
            else if (userRole === 'admin') navigate('/admin');
            else navigate('/');

        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
            {/* Brand Logo */}
            <div className="mb-8 flex items-center justify-center">
                <HeartPulse className="w-10 h-10 text-primary mr-2" />
                <span className="text-3xl font-bold text-slate-900">HealNexus</span>
            </div>

            <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h2>
                <p className="text-sm text-slate-500 mb-6">Please enter your details to sign in.</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="Enter your email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center items-center px-4 py-3 text-white text-sm font-semibold rounded-lg transition-all ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-800 shadow-md hover:shadow-lg'
                            }`}
                    >
                        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</> : 'Sign in'}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-500">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-semibold text-primary hover:text-blue-800 transition-colors">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}