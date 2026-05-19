import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, X } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import api from '../lib/axios';

export default function CreateTicket() {
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    category: 'General'
  });

  const categories = ['General', 'Hardware', 'Software', 'Network', 'Access', 'Other'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'Low': return t.tickets.priorityLow;
      case 'Medium': return t.tickets.priorityMedium;
      case 'High': return t.tickets.priorityHigh;
      case 'Critical': return t.tickets.priorityCritical;
      default: return priority;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/tickets', formData);
      toast.success(t.common.success);
      navigate('/tickets');
    } catch (error) {
      toast.error(t.common.error);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.tickets.createTitle}</h1>
        <p className="text-muted-foreground mt-1">
          {t.tickets.createSubtitle}
        </p>
      </div>

      <div className="glass-panel p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">{t.tickets.ticketTitle}</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t.tickets.ticketTitlePlaceholder}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">{t.tickets.categoryLabel}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t.tickets.priorityLabel}</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                {priorities.map(p => (
                  <option key={p} value={p}>{getPriorityLabel(p)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t.tickets.descLabel}</label>
            <textarea
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t.tickets.descPlaceholder}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-y"
            ></textarea>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 flex items-center gap-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t.tickets.submitBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
