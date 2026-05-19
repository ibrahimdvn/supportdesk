import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, Filter } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import api from '../lib/axios';

interface User {
  id: number;
  name: string;
}

interface Ticket {
  id: number;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  createdBy: User;
  assignedTo?: User;
}

export default function Tickets() {
  const { t } = useLanguageStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await api.get('/tickets');
        setTickets(response.data);
      } catch (error) {
        console.error('Failed to fetch tickets', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder={t.tickets.searchPlaceholder} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            <option value="All">{t.tickets.allStatus}</option>
            <option value="Open">{t.tickets.statusOpen}</option>
            <option value="InProgress">{t.tickets.statusInProgress}</option>
            <option value="Resolved">{t.tickets.statusResolved}</option>
            <option value="Closed">{t.tickets.statusClosed}</option>
          </select>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium text-muted-foreground">ID</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t.tickets.ticketTitle}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t.common.status}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t.common.priority}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t.common.createdOn}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t.common.assignedTo}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
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
                  <tr key={ticket.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/tickets/${ticket.id}`} className="text-muted-foreground group-hover:text-primary transition-colors">
                        #{ticket.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/tickets/${ticket.id}`} className="font-medium hover:text-primary transition-colors line-clamp-1">
                        {ticket.title}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-1">{ticket.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      {ticket.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                            {ticket.assignedTo.name.charAt(0)}
                          </div>
                          <span className="text-muted-foreground">{ticket.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">{t.common.unassigned}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
