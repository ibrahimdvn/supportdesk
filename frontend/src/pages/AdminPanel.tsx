import { useState, useEffect } from 'react';
import { Search, Mail, Shield, Trash2, Edit2, Check, X, ShieldAlert, Users as UsersIcon, LogOut, Settings, Ticket as TicketIcon, MessageSquare, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import LanguageSelector from '../components/common/LanguageSelector';
import { toast } from 'react-hot-toast';
import { Navigate, useNavigate } from 'react-router-dom';
import api from '../lib/axios';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  createdBy: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  assignedTo?: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPanel() {
  const { user: currentUser, logout, token: authToken, login: updateAuth } = useAuthStore();
  const { t } = useLanguageStore();
  const isAdmin = currentUser?.role === 'Admin';
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});

  // Settings states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'users' | 'tickets' | 'permissions'>('users');

  // User Permissions configuration states
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<string>('Employee');
  const [userOverrides, setUserOverrides] = useState<Record<string, boolean>>({});
  const [savingPermissions, setSavingPermissions] = useState(false);

  const permissionItems = [
    {
      key: 'create_ticket',
      labelTr: 'Bilet Oluşturma',
      labelEn: 'Create Tickets',
      defaultValue: { 'Admin': true, 'SupportAgent': true, 'Employee': true } as Record<string, boolean>
    },
    {
      key: 'view_all_tickets',
      labelTr: 'Tüm Biletleri Görme',
      labelEn: 'View All Tickets',
      defaultValue: { 'Admin': true, 'SupportAgent': true, 'Employee': false } as Record<string, boolean>
    },
    {
      key: 'change_status',
      labelTr: 'Bilet Durumunu Güncelleme',
      labelEn: 'Change Ticket Status',
      defaultValue: { 'Admin': true, 'SupportAgent': true, 'Employee': false } as Record<string, boolean>
    },
    {
      key: 'change_priority',
      labelTr: 'Bilet Önceliğini Güncelleme',
      labelEn: 'Change Ticket Priority',
      defaultValue: { 'Admin': true, 'SupportAgent': true, 'Employee': false } as Record<string, boolean>
    },
    {
      key: 'assign_agent',
      labelTr: 'Destek Temsilcisi Atama',
      labelEn: 'Assign Support Agents',
      defaultValue: { 'Admin': true, 'SupportAgent': true, 'Employee': false } as Record<string, boolean>
    },
    {
      key: 'delete_ticket',
      labelTr: 'Bilet Silme',
      labelEn: 'Delete Tickets',
      defaultValue: { 'Admin': true, 'SupportAgent': false, 'Employee': false } as Record<string, boolean>
    },
    {
      key: 'delete_comment',
      labelTr: 'Yorum Silme',
      labelEn: 'Delete Comments',
      defaultValue: { 'Admin': true, 'SupportAgent': false, 'Employee': false } as Record<string, boolean>
    },
    {
      key: 'manage_settings',
      labelTr: 'Sistem Ayarlarını Düzenleme',
      labelEn: 'Manage System Credentials',
      defaultValue: { 'Admin': true, 'SupportAgent': false, 'Employee': false } as Record<string, boolean>
    }
  ];

  const handleSaveUserPermissions = async () => {
    if (!selectedUserId) return;
    setSavingPermissions(true);
    try {
      const targetUser = users.find(u => u.id === selectedUserId);
      if (targetUser) {
        await api.put(`/users/${selectedUserId}`, {
          name: targetUser.name,
          email: targetUser.email,
          role: selectedUserRole
        });
        setUsers(users.map(u => u.id === selectedUserId ? { ...u, role: selectedUserRole } : u));
      }
      localStorage.setItem(`supportdesk_overrides_${selectedUserId}`, JSON.stringify(userOverrides));
      toast.success(t.admin.permSaveSuccess);
    } catch {
      toast.error(t.common.error);
    } finally {
      setSavingPermissions(false);
    }
  };
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);
  const [ticketSearchTerm, setTicketSearchTerm] = useState('');

  // Custom Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'user' | 'ticket' | 'comment'; id: number; title?: string } | null>(null);
  
  // Custom View Ticket Modal State
  const [selectedTicketForView, setSelectedTicketForView] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'Low': return t.tickets.priorityLow;
      case 'Medium': return t.tickets.priorityMedium;
      case 'High': return t.tickets.priorityHigh;
      case 'Critical': return t.tickets.priorityCritical;
      default: return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Open': return t.tickets.statusOpen;
      case 'InProgress': return t.tickets.statusInProgress;
      case 'Resolved': return t.tickets.statusResolved;
      case 'Closed': return t.tickets.statusClosed;
      default: return status;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Admin': return t.admin.roleAdmin;
      case 'SupportAgent': return t.admin.roleAgent;
      case 'Employee': return t.admin.roleEmployee;
      default: return role;
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTickets = async () => {
    setIsTicketsLoading(true);
    try {
      const response = await api.get('/tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets', error);
      toast.error(t.common.error);
    } finally {
      setIsTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && activeTab === 'tickets') {
      fetchTickets();
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!selectedTicketForView) return;
      setIsCommentsLoading(true);
      try {
        const response = await api.get(`/tickets/${selectedTicketForView.id}/comments`);
        setComments(response.data);
      } catch (error) {
        console.error('Failed to fetch comments', error);
        toast.error(t.common.error);
      } finally {
        setIsCommentsLoading(false);
      }
    };
    fetchComments();
  }, [selectedTicketForView]);

  const handleDeleteCommentClick = (commentId: number, commentContent: string) => {
    setDeleteTarget({
      type: 'comment',
      id: commentId,
      title: commentContent.length > 40 ? commentContent.slice(0, 40) + '...' : commentContent
    });
  };

  const handleUpdateTicket = async (ticketId: number, field: string, value: any) => {
    try {
      let payloadValue = value;
      if (field === 'status') {
        const statusMap: Record<string, number> = { 'Open': 0, 'InProgress': 1, 'Resolved': 2, 'Closed': 3 };
        payloadValue = statusMap[value];
      } else if (field === 'priority') {
        const priorityMap: Record<string, number> = { 'Low': 0, 'Medium': 1, 'High': 2, 'Critical': 3 };
        payloadValue = priorityMap[value];
      }

      await api.put(`/tickets/${ticketId}`, {
        [field === 'status' ? 'Status' : field === 'priority' ? 'Priority' : 'AssignedToId']: payloadValue
      });
      toast.success(t.common.success);
      fetchTickets();
    } catch (error) {
      toast.error(t.common.error);
    }
  };

  const handleDeleteTicketClick = (ticketId: number, title: string) => {
    setDeleteTarget({ type: 'ticket', id: ticketId, title });
  };

  const handleDeleteUserClick = (userId: number, name: string) => {
    setDeleteTarget({ type: 'user', id: userId, title: name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    try {
      if (type === 'ticket') {
        await api.delete(`/tickets/${id}`);
        setTickets(tickets.filter(t => t.id !== id));
        toast.success(t.common.success);
      } else if (type === 'user') {
        await api.delete(`/users/${id}`);
        setUsers(users.filter(u => u.id !== id));
        toast.success(t.common.success);
      } else if (type === 'comment') {
        if (!selectedTicketForView) return;
        await api.delete(`/tickets/${selectedTicketForView.id}/comments/${id}`);
        setComments(comments.filter(c => c.id !== id));
        toast.success(t.common.success);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setDeleteTarget(null);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(ticketSearchTerm.toLowerCase()) || 
    t.description.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
    t.createdBy.name.toLowerCase().includes(ticketSearchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'Admin').length,
    agents: users.filter(u => u.role === 'SupportAgent').length,
    employees: users.filter(u => u.role === 'Employee').length
  };

  const handleEditClick = (user: User) => {
    setEditingUserId(user.id);
    setEditFormData({ name: user.name, email: user.email, role: user.role });
  };

  const handleSaveEdit = async (id: number) => {
    try {
      await api.put(`/users/${id}`, editFormData);
      setUsers(users.map(u => u.id === id ? { ...u, ...editFormData } : u));
      
      if (currentUser?.id === id) {
        updateAuth({ 
          ...currentUser, 
          name: editFormData.name || currentUser.name, 
          email: editFormData.email || currentUser.email 
        }, authToken || '');
      }

      setEditingUserId(null);
      toast.success(t.common.success);
    } catch {
      toast.error(t.common.error);
    }
  };

  const handleAdminLogout = () => {
    logout();
    navigate('/login');
    toast.success(t.common.success);
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim()) {
      toast.error(t.common.error);
      return;
    }
    if (newPassword) {
      if (newPassword.length < 6) {
        toast.error(t.common.error);
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error(t.common.error);
        return;
      }
    }
    setIsUpdatingPassword(true);
    try {
      await api.post('/users/update-settings', { 
        username: adminUsername, 
        newPassword: newPassword || null 
      });
      if (currentUser) {
        updateAuth({ ...currentUser, email: adminUsername }, authToken || '');
      }
      toast.success(t.common.success);
      setIsSettingsOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const msg = error.response?.data?.message || t.common.error;
      toast.error(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'Admin': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'SupportAgent': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'Employee': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Premium Standalone Navbar */}
      <header className="h-16 border-b border-border bg-card/30 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-lg text-foreground flex items-center gap-1.5">
                SupportDesk <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">ADMIN PORTAL</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <button 
              onClick={() => {
                setAdminUsername(currentUser?.email || 'admin');
                setIsSettingsOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-border hover:bg-neutral-800 text-foreground rounded-lg text-sm font-medium transition-colors"
            >
              <Settings className="w-4 h-4" />
              {t.admin.settingsBtn}
            </button>
            <button 
              onClick={handleAdminLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t.common.logout}
            </button>
          </div>
        </div>
      </header>

      {/* Main Standalone Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 overflow-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.admin.title}</h1>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <UsersIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.statUsers}</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.admin.roleAdmin}</p>
              <p className="text-2xl font-bold">{stats.admins}</p>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.admin.roleAgent}</p>
              <p className="text-2xl font-bold">{stats.agents}</p>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-500">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.admin.roleEmployee}</p>
              <p className="text-2xl font-bold">{stats.employees}</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border/60 mb-6">
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'users' 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            {t.admin.tabUsers}
          </button>
          <button 
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'tickets' 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <TicketIcon className="w-4 h-4" />
            {t.admin.tabTickets}
          </button>
          <button 
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'permissions' 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="w-4 h-4" />
            {t.admin.tabPermissions}
          </button>
        </div>

        {/* User Management Panel */}
        {activeTab === 'users' && (
          <>
            {/* Search */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder={t.admin.searchUsers} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* User Management Table */}
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-medium text-muted-foreground align-middle">{t.admin.thName}</th>
                      <th className="px-6 py-4 font-medium text-muted-foreground align-middle">{t.admin.thEmail}</th>
                      <th className="px-6 py-4 font-medium text-muted-foreground align-middle">{t.admin.thRole}</th>
                      <th className="px-6 py-4 font-medium text-muted-foreground text-right align-middle">{t.admin.thActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center align-middle">
                          <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground align-middle">
                          {t.common.loading}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              {editingUserId === user.id ? (
                                <input 
                                  type="text" 
                                  value={editFormData.name || ''} 
                                  onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                                  className="bg-background border border-border rounded px-2 py-1 text-sm w-full text-foreground"
                                />
                              ) : (
                                <span className="font-medium">{user.name}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            {editingUserId === user.id ? (
                              <input 
                                type="email" 
                                value={editFormData.email || ''} 
                                onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                                className="bg-background border border-border rounded px-2 py-1 text-sm w-full text-foreground"
                              />
                            ) : (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="w-4 h-4 shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 align-middle">
                            {editingUserId === user.id ? (
                              <select
                                value={editFormData.role || 'Employee'}
                                onChange={e => setEditFormData({...editFormData, role: e.target.value})}
                                disabled={currentUser?.id === user.id}
                                className="bg-background border border-border rounded pl-2.5 pr-8 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="Employee">{t.admin.roleEmployee}</option>
                                <option value="SupportAgent">{t.admin.roleAgent}</option>
                                <option value="Admin">{t.admin.roleAdmin}</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                                <Shield className="w-3.5 h-3.5" />
                                {getRoleLabel(user.role)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right align-middle">
                            {editingUserId === user.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleSaveEdit(user.id)} className="p-1 text-green-500 hover:bg-green-500/10 rounded transition-colors">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => setEditingUserId(null)} className="p-1 text-slate-500 hover:bg-slate-500/10 rounded transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleEditClick(user)}
                                  className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors"
                                  title={t.common.edit}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUserClick(user.id, user.name)}
                                  disabled={currentUser?.id === user.id}
                                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50"
                                  title={t.common.delete}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Ticket Management Panel */}
        {activeTab === 'tickets' && (
          <>
            {/* Search */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder={t.tickets.searchPlaceholder} 
                  value={ticketSearchTerm}
                  onChange={(e) => setTicketSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground"
                />
              </div>
            </div>

            {/* Tickets Table */}
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-medium text-muted-foreground align-middle">{t.tickets.ticketTitle}</th>
                      <th className="px-6 py-4 font-medium text-muted-foreground align-middle">{t.common.category}</th>
                      <th className="px-6 py-4 font-medium text-muted-foreground align-middle">{t.common.priority}</th>
                      <th className="px-6 py-4 font-medium text-muted-foreground align-middle">{t.common.status}</th>
                      <th className="px-6 py-4 font-medium text-muted-foreground align-middle">{t.common.assignedTo}</th>
                      <th className="px-6 py-4 font-medium text-muted-foreground text-right align-middle">{t.admin.thActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isTicketsLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center">
                          <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        </td>
                      </tr>
                    ) : filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                          {t.dashboard.noTickets}
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 align-middle">
                            <div className="flex flex-col">
                              <span 
                                onClick={() => setSelectedTicketForView(ticket)}
                                className="font-semibold text-foreground text-sm flex items-center gap-1.5 hover:text-primary hover:underline cursor-pointer transition-colors"
                                title="Click to view full ticket details"
                              >
                                #{ticket.id} {ticket.title}
                              </span>
                              <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[240px]">
                                {ticket.description}
                              </span>
                              <span className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                                <span>{t.common.createdBy} <strong>{ticket.createdBy.name}</strong> ({getRoleLabel(ticket.createdBy.role)})</span>
                                <span>•</span>
                                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <span className="text-xs bg-muted border border-border px-2 py-0.5 rounded-full font-medium text-foreground">
                              {ticket.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <select
                              value={ticket.priority}
                              onChange={(e) => handleUpdateTicket(ticket.id, 'priority', e.target.value)}
                              className={`text-xs font-semibold pl-2.5 pr-8 py-1 rounded-lg bg-neutral-950 border border-border focus:outline-none focus:ring-1 focus:ring-primary ${
                                ticket.priority === 'Critical' ? 'text-red-400 border-red-500/30' :
                                ticket.priority === 'High' ? 'text-orange-400 border-orange-500/30' :
                                ticket.priority === 'Medium' ? 'text-yellow-400 border-yellow-500/30' :
                                'text-green-400 border-green-500/30'
                              }`}
                            >
                              <option value="Low">{t.tickets.priorityLow}</option>
                              <option value="Medium">{t.tickets.priorityMedium}</option>
                              <option value="High">{t.tickets.priorityHigh}</option>
                              <option value="Critical">{t.tickets.priorityCritical}</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <select
                              value={ticket.status}
                              onChange={(e) => handleUpdateTicket(ticket.id, 'status', e.target.value)}
                              className={`text-xs font-semibold pl-2.5 pr-8 py-1 rounded-lg bg-neutral-950 border border-border focus:outline-none focus:ring-1 focus:ring-primary ${
                                ticket.status === 'Open' ? 'text-blue-400 border-blue-500/30' :
                                ticket.status === 'InProgress' ? 'text-yellow-400 border-yellow-500/30' :
                                ticket.status === 'Resolved' ? 'text-green-400 border-green-500/30' :
                                'text-neutral-400 border-neutral-500/30'
                              }`}
                            >
                              <option value="Open">{t.tickets.statusOpen}</option>
                              <option value="InProgress">{t.tickets.statusInProgress}</option>
                              <option value="Resolved">{t.tickets.statusResolved}</option>
                              <option value="Closed">{t.tickets.statusClosed}</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <select
                              value={ticket.assignedTo?.id || ''}
                              onChange={(e) => handleUpdateTicket(ticket.id, 'assignedToId', e.target.value ? parseInt(e.target.value) : null)}
                              className="text-xs pl-2.5 pr-8 py-1 rounded-lg bg-neutral-950 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[150px]"
                            >
                              <option value="">{t.common.unassigned}</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>
                                  {u.name} ({getRoleLabel(u.role)})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right align-middle">
                            <button 
                              onClick={() => handleDeleteTicketClick(ticket.id, ticket.title)}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                              title={t.common.delete}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Permissions Panel */}
        {activeTab === 'permissions' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="glass-panel p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Shield className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{t.admin.permissionsTitle}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t.admin.permissionsSubtitle}</p>
                </div>
              </div>

              {/* Two-Column split layout */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Column 1: Default Role Permissions Panel (Static summary) */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-foreground/80 tracking-wide uppercase flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    {t.admin.permRoleDefaults}
                  </h4>

                  {/* Admin Role Permissions Card */}
                  <div className="glass-panel p-4 border-red-500/20 bg-red-500/[0.01]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {t.admin.roleAdmin}
                      </span>
                      <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                        {t.admin.permAllAccess}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground space-y-1.5">
                      <div className="flex justify-between"><span>{t.admin.permLabelCreate}</span><span className="text-green-500 font-semibold">{t.admin.permAllowed}</span></div>
                      <div className="flex justify-between"><span>{t.admin.permLabelViewAll}</span><span className="text-green-500 font-semibold">{t.admin.permAllowed}</span></div>
                      <div className="flex justify-between"><span>{t.admin.permLabelStatus}</span><span className="text-green-500 font-semibold">{t.admin.permAllowed}</span></div>
                      <div className="flex justify-between"><span>{t.admin.permLabelPriority}</span><span className="text-green-500 font-semibold">{t.admin.permAllowed}</span></div>
                      <div className="flex justify-between"><span>{t.admin.permLabelAssign}</span><span className="text-green-500 font-semibold">{t.admin.permAllowed}</span></div>
                      <div className="flex justify-between"><span>{t.admin.permLabelDeleteTicket}</span><span className="text-green-500 font-semibold">{t.admin.permAllowed}</span></div>
                      <div className="flex justify-between"><span>{t.admin.permLabelDeleteComment}</span><span className="text-green-500 font-semibold">{t.admin.permAllowed}</span></div>
                      <div className="flex justify-between"><span>{t.admin.permLabelSettings}</span><span className="text-green-500 font-semibold">{t.admin.permAllowed}</span></div>
                    </div>
                  </div>

                  {/* Support Agent Role Permissions Card */}
                  <div className="glass-panel p-4 border-purple-500/20 bg-purple-500/[0.01]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        {t.admin.roleAgent}
                      </span>
                      <span className="text-[10px] bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                        {t.admin.permStaffAccess}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground space-y-1.5">
                      <div className="flex justify-between"><span>{t.admin.permLabelCreate}</span><span className="text-green-500 font-semibold">{t.admin.permAllowed}</span></div>
                      <div className="flex justify-between"><span>{t.admin.permLabelViewAll}</span><span className="text-green-500 font-semibold">{t.admin.permAllowed}</span></div>
                      <div className="flex justify-between"><span>{t.admin.permLabelStatus}</span><span className="text-green-500 font-semibold">{t.admin.permAllowed}</span></div>
                      <div className="flex justify-between"><span>{t.admin.permLabelPriority}</span><span className="text-green-500 font-semibold">{t.admin.permAllowed}</span></div>
                      <div className="flex justify-between"><span>{t.admin.permLabelAssign}</span><span className="text-green-500 font-semibold">{t.admin.permAllowed}</span></div>
                      <div className="flex justify-between"><span>{t.admin.permLabelDeleteTicket}</span><span className="text-red-500 font-semibold">{t.admin.permDenied}</span></div>
                      <div className="flex justify-between"><span>{t.admin.permLabelDeleteComment}</span><span className="text-red-500 font-semibold">{t.admin.permDenied}</span></div>
                      <div className="flex justify-between"><span>{t.admin.permLabelSettings}</span><span className="text-red-500 font-semibold">{t.admin.permDenied}</span></div>
                    </div>
                  </div>

                  {/* Employee Role Permissions Card */}
                  <div className="glass-panel p-4 border-blue-500/20 bg-blue-500/[0.01]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                        <UsersIcon className="w-3.5 h-3.5" />
                        {t.admin.roleEmployee}
                      </span>
                      <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                        {t.admin.permClientAccess}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground space-y-1.5">
                      <div className="flex justify-between"><span>{t.admin.permLabelCreate}</span><span className="text-green-500 font-semibold">{t.admin.permAllowed}</span></div>
                      <div className="flex justify-between text-red-400/90 font-medium"><span>{t.admin.permLabelViewAll}</span><span>{t.admin.permDenied}</span></div>
                      <div className="flex justify-between text-red-400/90 font-medium"><span>{t.admin.permLabelStatus}</span><span>{t.admin.permDenied}</span></div>
                      <div className="flex justify-between text-red-400/90 font-medium"><span>{t.admin.permLabelPriority}</span><span>{t.admin.permDenied}</span></div>
                      <div className="flex justify-between text-red-400/90 font-medium"><span>{t.admin.permLabelAssign}</span><span>{t.admin.permDenied}</span></div>
                      <div className="flex justify-between text-red-400/90 font-medium"><span>{t.admin.permLabelDeleteTicket}</span><span>{t.admin.permDenied}</span></div>
                      <div className="flex justify-between text-red-400/90 font-medium"><span>{t.admin.permLabelDeleteComment}</span><span>{t.admin.permDenied}</span></div>
                      <div className="flex justify-between text-red-400/90 font-medium"><span>{t.admin.permLabelSettings}</span><span>{t.admin.permDenied}</span></div>
                    </div>
                  </div>
                </div>

                {/* Column 2 & 3: Dynamic User Permissions Management Panel */}
                <div className="xl:col-span-2 space-y-4">
                  <h4 className="text-sm font-bold text-foreground/80 tracking-wide uppercase flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-primary" />
                    {t.admin.permUserOverrides}
                  </h4>

                  <div className="glass-panel p-6 space-y-6">
                    {/* User Selector Dropdown */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t.admin.permSelectUser}
                      </label>
                      <div className="relative">
                        <select
                          value={selectedUserId || ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value) : null;
                            setSelectedUserId(val);
                            if (val) {
                              const selectedUser = users.find(u => u.id === val);
                              setSelectedUserRole(selectedUser?.role || 'Employee');
                              const saved = localStorage.getItem(`supportdesk_overrides_${val}`);
                              if (saved) {
                                try {
                                  setUserOverrides(JSON.parse(saved));
                                } catch {
                                  setUserOverrides({});
                                }
                              } else {
                                setUserOverrides({});
                              }
                            } else {
                              setUserOverrides({});
                            }
                          }}
                          className="w-full bg-neutral-950 border border-border/80 focus:border-primary/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                        >
                          <option value="">-- {t.admin.permSelectUser} --</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.email}) - [{u.role === 'Admin' ? t.admin.roleAdmin : u.role === 'SupportAgent' ? t.admin.roleAgent : t.admin.roleEmployee}]
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {selectedUserId ? (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Active Role Selector */}
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">{t.admin.permActiveRole}</span>
                            <span className="text-base font-bold text-foreground">
                              {users.find(u => u.id === selectedUserId)?.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <select
                              value={selectedUserRole}
                              onChange={(e) => setSelectedUserRole(e.target.value)}
                              className="bg-neutral-900 border border-border/60 hover:border-primary/40 rounded-lg px-3 py-1.5 text-sm focus:outline-none text-foreground font-semibold"
                            >
                              <option value="Employee">{t.admin.roleEmployee}</option>
                              <option value="SupportAgent">{t.admin.roleAgent}</option>
                              <option value="Admin">{t.admin.roleAdmin}</option>
                            </select>
                          </div>
                        </div>

                        {/* Permission Custom Overrides Checklist */}
                        <div className="space-y-3">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                            {t.admin.permOverrideNotice}
                          </span>

                          <div className="space-y-2.5">
                            {permissionItems.map((item) => {
                              const isInheritedAllowed = item.defaultValue[selectedUserRole] === true;
                              const currentOverride = userOverrides[item.key];
                              const isCurrentlyAllowed = currentOverride !== undefined ? currentOverride : isInheritedAllowed;
                              const isOverridden = currentOverride !== undefined;

                              return (
                                <div 
                                  key={item.key} 
                                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                                    isOverridden 
                                      ? 'bg-primary/[0.04] border-primary/40 shadow-[0_0_15px_rgba(var(--primary-rgb),0.05)]' 
                                      : 'bg-card border-border/40 hover:border-border/80'
                                  }`}
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-foreground">
                                        {t.common.language === 'Language' ? item.labelEn : item.labelTr}
                                      </span>
                                      {isOverridden && (
                                        <span className="text-[9px] bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                          Override
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                      <span>Inherited:</span>
                                      <span className={isInheritedAllowed ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                                        {isInheritedAllowed ? t.admin.permAllowed : t.admin.permDenied}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    {/* Permission Status Indicator */}
                                    <span className={`text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                                      isCurrentlyAllowed 
                                        ? 'text-green-500 bg-green-500/10 border-green-500/20' 
                                        : 'text-red-500 bg-red-500/10 border-red-500/20'
                                    }`}>
                                      {isCurrentlyAllowed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                      {isCurrentlyAllowed ? t.admin.permAllowed : t.admin.permDenied}
                                    </span>

                                    {/* Action Toggle Switch */}
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={isCurrentlyAllowed}
                                        onChange={(e) => {
                                          setUserOverrides({
                                            ...userOverrides,
                                            [item.key]: e.target.checked
                                          });
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                    </label>

                                    {/* Clear Override Button if present */}
                                    {isOverridden && (
                                      <button
                                        onClick={() => {
                                          const copy = { ...userOverrides };
                                          delete copy[item.key];
                                          setUserOverrides(copy);
                                        }}
                                        className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors uppercase tracking-wider"
                                        title="Restore Default"
                                      >
                                        Restore
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={handleSaveUserPermissions}
                            disabled={savingPermissions}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all shrink-0 w-full sm:w-auto justify-center"
                          >
                            {savingPermissions ? (
                              <>
                                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                {t.common.updating}
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4" />
                                {t.common.save}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border/60 rounded-2xl text-center p-6 text-muted-foreground">
                        <Shield className="w-10 h-10 mb-3 text-muted-foreground/40" />
                        <p className="text-sm font-semibold">{t.admin.permSelectUser}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Settings / Password Change Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md p-6 relative animate-in fade-in-50 zoom-in-95 duration-200">
            <button 
              onClick={() => {
                setIsSettingsOpen(false);
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">{t.admin.settingsTitle}</h3>
                <p className="text-xs text-muted-foreground">{t.admin.settingsSubtitle}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  {t.admin.setAdminUser}
                </label>
                <input 
                  type="text" 
                  required
                  placeholder={t.admin.usernamePlaceholder}
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  {t.admin.setNewPass}
                </label>
                <input 
                  type="password" 
                  placeholder={t.admin.newPassPlaceholder}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  {t.admin.setConfirmPass}
                </label>
                <input 
                  type="password" 
                  placeholder={t.admin.confirmPassPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-border text-foreground rounded-lg text-sm font-medium transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isUpdatingPassword ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      {t.admin.updatingSettings}
                    </>
                  ) : (
                    t.common.saveSettings
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-30 duration-200">
          <div className="glass-panel w-full max-w-md p-6 relative animate-in fade-in-50 zoom-in-95 duration-200">
            <button 
              onClick={() => setDeleteTarget(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4 mx-auto">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>

            <h3 className="font-bold text-lg text-foreground text-center mb-2">
              {t.common.delete} {deleteTarget.type === 'ticket' ? t.admin.tabTickets : deleteTarget.type === 'comment' ? t.detail.commentsTitle : t.dashboard.statUsers}
            </h3>
            
            <p className="text-sm text-muted-foreground text-center mb-6">
              {t.detail.deleteCommentConfirm}{' '}
              <strong className="text-foreground">"{deleteTarget.title}"</strong>? 
              {t.common.permanentAction}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-border text-foreground rounded-lg text-sm font-medium transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {t.common.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom View Ticket Details Modal */}
      {selectedTicketForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-30 duration-200">
          <div className="glass-panel w-full max-w-2xl p-6 relative animate-in fade-in-50 zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedTicketForView(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-1">
                <TicketIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">{t.tickets.ticketTitle} #{selectedTicketForView.id}</div>
                <h3 className="font-bold text-xl text-foreground leading-tight">{selectedTicketForView.title}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 mb-6 text-xs">
              <div>
                <span className="text-muted-foreground block mb-1">{t.common.category}</span>
                <span className="bg-neutral-900 border border-border px-2 py-0.5 rounded text-foreground font-medium">
                  {selectedTicketForView.category}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">{t.common.priority}</span>
                <span className={`font-semibold px-2 py-0.5 rounded border ${
                  selectedTicketForView.priority === 'Critical' ? 'text-red-400 bg-red-500/10 border-red-500/30' :
                  selectedTicketForView.priority === 'High' ? 'text-orange-400 bg-orange-500/10 border-orange-500/30' :
                  selectedTicketForView.priority === 'Medium' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' :
                  'text-green-400 bg-green-500/10 border-green-500/30'
                }`}>
                  {getPriorityLabel(selectedTicketForView.priority)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">{t.common.status}</span>
                <span className={`font-semibold px-2 py-0.5 rounded border ${
                  selectedTicketForView.status === 'Open' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' :
                  selectedTicketForView.status === 'InProgress' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' :
                  selectedTicketForView.status === 'Resolved' ? 'text-green-400 bg-green-500/10 border-green-500/30' :
                  'text-neutral-400 bg-neutral-500/10 border-neutral-500/30'
                }`}>
                  {getStatusLabel(selectedTicketForView.status)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">{t.common.assignedTo}</span>
                <span className="text-foreground font-medium">
                  {selectedTicketForView.assignedTo ? selectedTicketForView.assignedTo.name : t.common.unassigned}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.tickets.descLabel}</h4>
              <div className="bg-neutral-950/50 border border-border/80 rounded-xl p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {selectedTicketForView.description}
              </div>
            </div>

            {/* Process History & Comments */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {t.detail.commentsTitle} ({comments.length})
                </h4>
              </div>

              <div className="bg-neutral-950/40 border border-border/60 rounded-xl p-4 max-h-[320px] overflow-y-auto space-y-4">
                {isCommentsLoading ? (
                  <div className="flex justify-center items-center py-6">
                    <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4 italic">{t.detail.noComments}</p>
                ) : (
                  <div className="space-y-3.5">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-neutral-900/60 border border-border/30 hover:border-border/60 transition-all group/comment">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">
                            {comment.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold text-foreground">{comment.user.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wider scale-95 ${
                                comment.user.role === 'Admin' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                                comment.user.role === 'SupportAgent' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                                'text-blue-400 bg-blue-500/10 border-blue-500/20'
                              }`}>
                                {getRoleLabel(comment.user.role)}
                              </span>
                              <span className="text-[10px] text-muted-foreground/80">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-foreground/90 mt-1 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteCommentClick(comment.id, comment.content)}
                          className="p-1 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover/comment:opacity-100 focus:opacity-100 shrink-0"
                          title={t.common.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-border/50 text-xs text-muted-foreground gap-2">
              <div>
                {t.common.createdBy} <strong className="text-foreground">{selectedTicketForView.createdBy.name}</strong> ({getRoleLabel(selectedTicketForView.createdBy.role)})
              </div>
              <div>
                {t.common.createdOn} {new Date(selectedTicketForView.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
