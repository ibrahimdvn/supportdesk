import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Send, ArrowLeft, Clock, User as UserIcon, Tag, Trash2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import api from '../lib/axios';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    role: string;
  };
}

interface TicketDetail {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  createdBy: { id: number; name: string };
  assignedTo?: { id: number; name: string };
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const hasStatusPermission = (() => {
    if (!user) return false;
    const savedOverrides = localStorage.getItem(`supportdesk_overrides_${user.id}`);
    if (savedOverrides) {
      try {
        const overrides = JSON.parse(savedOverrides);
        if (overrides['change_status'] !== undefined) {
          return overrides['change_status'] as boolean;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return user.role === 'Admin' || user.role === 'SupportAgent';
  })();

  useEffect(() => {
    const fetchTicketAndComments = async () => {
      try {
        const [ticketRes, commentsRes] = await Promise.all([
          api.get(`/tickets/${id}`),
          api.get(`/tickets/${id}/comments`)
        ]);
        setTicket(ticketRes.data);
        setComments(commentsRes.data);
      } catch {
        toast.error(t.common.error);
        navigate('/tickets');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchTicketAndComments();
  }, [id, navigate, t.common.error]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.put(`/tickets/${id}`, { status: newStatus });
      setTicket(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(t.common.success);
    } catch {
      toast.error(t.common.error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post(`/tickets/${id}/comments`, { content: newComment });
      setComments([...comments, response.data]);
      setNewComment('');
      toast.success(t.common.success);
    } catch {
      toast.error(t.common.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTicket = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/tickets/${id}`);
      toast.success(t.common.success);
      navigate('/tickets');
    } catch {
      toast.error(t.common.error);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

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

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'Low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Open': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'InProgress': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'Resolved': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'Closed': return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  if (isLoading || !ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/tickets')}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              #{ticket.id} - {ticket.title}
            </h1>
          </div>
        </div>
        
        {user?.role === 'Admin' && (
          <button
            onClick={handleDeleteTicket}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            {t.common.delete}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold mb-4">{t.tickets.descLabel}</h3>
            <div className="prose prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-muted-foreground">{ticket.description}</p>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              {t.detail.commentsTitle}
            </h3>
            
            <div className="space-y-6 mb-6">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground italic py-4">{t.detail.noComments}</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex shrink-0 items-center justify-center text-primary font-bold">
                      {comment.user.name.charAt(0)}
                    </div>
                    <div className="flex-1 bg-muted/30 rounded-2xl rounded-tl-none p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {comment.user.name}{' '}
                          <span className="text-xs text-muted-foreground ml-2 px-2 py-0.5 rounded-full bg-background/50 border border-border">
                            {comment.user.role === 'Admin' ? t.admin.roleAdmin : comment.user.role === 'SupportAgent' ? t.admin.roleAgent : t.admin.roleEmployee}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="mt-4 pt-4 border-t border-border">
              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {user?.name.charAt(0)}
                </div>
                <div className="flex-1 relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t.detail.addCommentPlaceholder}
                    className="w-full pl-4 pr-12 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none min-h-[80px]"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="absolute right-2 bottom-2 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:hover:bg-primary"
                  >
                    {isSubmitting ? (
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin block"></span>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold mb-4">{t.detail.title}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">{t.common.status}</label>
                {hasStatusPermission ? (
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-medium ${getStatusColor(ticket.status)}`}
                  >
                    <option value="Open">{t.tickets.statusOpen}</option>
                    <option value="InProgress">{t.tickets.statusInProgress}</option>
                    <option value="Resolved">{t.tickets.statusResolved}</option>
                    <option value="Closed">{t.tickets.statusClosed}</option>
                  </select>
                ) : (
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}>
                    {getStatusLabel(ticket.status)}
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">{t.common.priority}</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(ticket.priority)}`}>
                  {getPriorityLabel(ticket.priority)}
                </span>
              </div>

              <div className="pt-4 border-t border-border flex items-center gap-3">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{t.common.category}</span>
                  <span className="text-sm font-medium">{ticket.category}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center gap-3">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{t.common.createdBy}</span>
                  <span className="text-sm font-medium">{ticket.createdBy.name}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center gap-3">
                <UserIcon className="w-4 h-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{t.common.assignedTo}</span>
                  <span className="text-sm font-medium">
                    {ticket.assignedTo?.name || t.common.unassigned}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{t.common.createdOn}</span>
                  <span className="text-sm font-medium">{format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{t.common.confirmDelete}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {t.detail.deleteTicketConfirm}? {t.common.permanentAction}
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg font-medium text-sm border border-border hover:bg-muted transition-colors disabled:opacity-50"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    {t.common.loading}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {t.common.delete}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
