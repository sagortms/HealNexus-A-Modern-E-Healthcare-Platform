import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, LayoutDashboard, Users, Activity,
    ShieldCheck, UserCog, Check, X, Search, Loader2, FileText, Eye, ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import AnimatedLogo from '../../components/common/AnimatedLogo';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewDoc, setViewDoc] = useState(null); // New state for viewing qualification PDF

    const API_BASE_URL = 'http://127.0.0.1:8000';

    const [dashboardData, setDashboardData] = useState({
        admin_name: '', stats: {}, pending_doctors: [], all_users: []
    });

    // Edit Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ full_name: '', phone: '', password: '' });

    const fetchAdminData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');
        try {
            const response = await api.get('/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } });
            setDashboardData(response.data);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('token'); navigate('/login');
            }
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchAdminData(); }, [navigate]);

    const handleAction = async (endpoint, method, data = null) => {
        const token = localStorage.getItem('token');
        try {
            await api({ method, url: endpoint, data, headers: { Authorization: `Bearer ${token}` } });
            fetchAdminData(); // Refresh data instantly
            setIsEditModalOpen(false);
            alert("Action successful!");
        } catch (err) { alert("Action failed."); }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setEditForm({ full_name: user.full_name, phone: user.phone || '', password: '' });
        setIsEditModalOpen(true);
    };

    const filteredUsers = dashboardData.all_users.filter(u => u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    if (loading) return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-[#020817] flex flex-col md:flex-row font-sans relative transition-colors duration-500">

            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col md:min-h-screen sticky top-0 md:h-screen z-20 transition-colors duration-500 shadow-xl">
                <div className="p-6 flex items-center border-b border-slate-800 bg-slate-950 dark:bg-black/20">
                    <AnimatedLogo />
                </div>

                <div className="p-4 flex-1">
                    <p className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-4 px-2">Admin Controls</p>
                    <nav className="space-y-1.5">
                        <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                            <LayoutDashboard className="w-5 h-5" /> <span>Overview</span>
                        </button>
                        <button onClick={() => setActiveTab('approvals')} className={`w-full flex justify-between items-center px-4 py-3 rounded-xl transition-all ${activeTab === 'approvals' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                            <div className="flex items-center space-x-3"><ShieldCheck className="w-5 h-5" /> <span>Approvals</span></div>
                            {dashboardData.stats.pending_approvals > 0 && <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{dashboardData.stats.pending_approvals}</span>}
                        </button>
                        <button onClick={() => setActiveTab('users')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                            <Users className="w-5 h-5" /> <span>Manage Users</span>
                        </button>
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} className="w-full flex items-center space-x-3 px-4 py-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-medium">
                        <LogOut className="w-4 h-4" /> <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">

                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="animate-in fade-in">
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-6 transition-colors">System Overview</h1>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4 transition-colors">
                                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center transition-colors"><Users className="w-7 h-7" /></div>
                                <div><p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Patients</p><p className="text-3xl font-extrabold text-slate-900 dark:text-white transition-colors">{dashboardData.stats.total_patients}</p></div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4 transition-colors">
                                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center transition-colors"><Activity className="w-7 h-7" /></div>
                                <div><p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Approved Doctors</p><p className="text-3xl font-extrabold text-slate-900 dark:text-white transition-colors">{dashboardData.stats.total_doctors}</p></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: APPROVALS */}
                {activeTab === 'approvals' && (
                    <div className="animate-in fade-in transition-colors">
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 transition-colors">Doctor Approvals</h1>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 transition-colors">Review licenses and grant system access.</p>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
                                {dashboardData.pending_doctors.length > 0 ? dashboardData.pending_doctors.map(doc => (
                                    <div key={doc.id} className="p-6 flex flex-col md:flex-row justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white transition-colors">Dr. {doc.full_name}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">Email: {doc.email} | License: {doc.license_no || 'N/A'}</p>
                                            {doc.application_document_path && (
                                                <button
                                                    onClick={() => setViewDoc({ name: doc.full_name, path: doc.application_document_path })}
                                                    className="mt-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center hover:underline"
                                                >
                                                    <FileText className="w-3 h-3 mr-1" /> View Qualification Document
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex space-x-3 mt-4 md:mt-0">
                                            <button onClick={() => handleAction(`/admin/approve-doctor/${doc.id}`, 'PUT')} className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-lg font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 flex items-center transition-colors"><Check className="w-4 h-4 mr-2" /> Approve</button>
                                            <button onClick={() => handleAction(`/admin/reject-doctor/${doc.id}`, 'DELETE')} className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-4 py-2 rounded-lg font-bold hover:bg-rose-200 dark:hover:bg-rose-900/50 flex items-center transition-colors"><X className="w-4 h-4 mr-2" /> Reject</button>
                                        </div>
                                    </div>
                                )) : <div className="p-12 text-center text-slate-500 dark:text-slate-600 transition-colors">No pending approvals!</div>}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: MANAGE USERS */}
                {activeTab === 'users' && (
                    <div className="animate-in fade-in transition-colors">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white transition-colors">User Database</h1>
                            <div className="relative w-full md:w-64">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                <input type="text" placeholder="Search name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider transition-colors">
                                        <tr><th className="px-6 py-4 font-bold">ID</th><th className="px-6 py-4 font-bold">Name</th><th className="px-6 py-4 font-bold">Role</th><th className="px-6 py-4 font-bold">Phone</th><th className="px-6 py-4 font-bold text-right">Actions</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm transition-colors">
                                        {filteredUsers.map(user => (
                                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">{user.id}</td>
                                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{user.full_name}<br /><span className="text-xs text-slate-400 dark:text-slate-500 font-normal">{user.email}</span><br /><span className="text-xs text-slate-400 dark:text-slate-500 font-normal">License: {user.license_no || 'N/A'}</span></td>
                                                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : user.role === 'doctor' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>{user.role}</span></td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{user.phone || 'N/A'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => openEditModal(user)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold flex items-center justify-end w-full"><UserCog className="w-4 h-4 mr-1" /> Edit</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Edit User Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in transition-all">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800 transition-colors">
                        <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Edit User: {editingUser.full_name}</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleAction(`/admin/users/${editingUser.id}`, 'PUT', editForm); }} className="space-y-4 mt-6">
                            <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label><input type="text" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-colors" /></div>
                            <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label><input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-colors" /></div>
                            <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">New Password (leave blank to keep current)</label><input type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-colors" placeholder="••••••••" /></div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 transition-all mt-4">Save Changes</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Qualification Document Viewer Modal */}
            {viewDoc && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in transition-all">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors">

                        {/* Header */}
                        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 transition-colors">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Qualification Document</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Reviewing credentials for Dr. {viewDoc.name}</p>
                            </div>
                            <button onClick={() => setViewDoc(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* File Viewer Area */}
                        <div className="flex-1 overflow-auto p-4 bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[50vh] transition-colors">
                            {viewDoc.path.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                <img src={`${API_BASE_URL}/${viewDoc.path}`} alt="Doctor Qualification" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                            ) : viewDoc.path.match(/\.(pdf)$/i) ? (
                                <iframe src={`${API_BASE_URL}/${viewDoc.path}`} className="w-full h-[60vh] md:h-[70vh] rounded-lg shadow-sm bg-white" title="PDF Document" />
                            ) : (
                                <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-600 dark:text-slate-400 font-medium mb-4">Preview not available for this file type.</p>
                                    <a href={`${API_BASE_URL}/${viewDoc.path}`} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors inline-flex items-center">
                                        <ExternalLink className="w-4 h-4 mr-2" /> Open / Download Document
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}