import { useState, useEffect } from 'react';
import { Ticket, CheckCircle2, CircleDashed, AlertCircle, Users } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import api from '../lib/axios';

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  totalUsers: number;
  ticketsByPriority: Record<string, number>;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/tickets/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: t.dashboard.statTotal,
      value: stats?.totalTickets || 0,
      icon: Ticket,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: t.dashboard.statOpen,
      value: stats?.openTickets || 0,
      icon: CircleDashed,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: t.dashboard.statResolved,
      value: stats?.resolvedTickets || 0,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: t.dashboard.statUsers,
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t.dashboard.welcomeUser} {user?.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t.dashboard.portalSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="glass-panel p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            {t.dashboard.priorityDistribution}
          </h3>
          <div className="space-y-4">
            {['Critical', 'High', 'Medium', 'Low'].map((priority) => {
              const count = stats?.ticketsByPriority[priority] || 0;
              const total = stats?.totalTickets || 1; // prevent div by zero
              const percentage = Math.round((count / total) * 100);
              
              let color = 'bg-slate-500';
              let priorityLabel = priority;
              if (priority === 'Critical') {
                color = 'bg-red-500';
                priorityLabel = t.tickets.priorityCritical;
              }
              if (priority === 'High') {
                color = 'bg-orange-500';
                priorityLabel = t.tickets.priorityHigh;
              }
              if (priority === 'Medium') {
                color = 'bg-yellow-500';
                priorityLabel = t.tickets.priorityMedium;
              }
              if (priority === 'Low') {
                color = 'bg-blue-500';
                priorityLabel = t.tickets.priorityLow;
              }

              return (
                <div key={priority}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-muted-foreground">{priorityLabel}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
