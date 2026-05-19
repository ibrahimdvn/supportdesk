import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, LogOut, PlusCircle, Users } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import LanguageSelector from '../common/LanguageSelector';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { t } = useLanguageStore();
  const location = useLocation();

  const navItems = [
    { name: t.common.welcome, path: '/dashboard', icon: LayoutDashboard },
    { name: t.admin.tabTickets, path: '/tickets', icon: Ticket },
    { name: t.admin.tabUsers, path: '/users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Ticket className="w-6 h-6 text-primary" />
            SupportDesk
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none mb-1">{user?.name}</span>
              <span className="text-xs text-muted-foreground leading-none">
                {user?.role === 'Admin' ? t.admin.roleAdmin : user?.role === 'SupportAgent' ? t.admin.roleAgent : t.admin.roleEmployee}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t.common.logout}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <h2 className="text-lg font-semibold capitalize">
            {location.pathname.includes('/tickets/new') ? t.tickets.createTitle : 
             location.pathname.includes('/tickets') ? t.admin.tabTickets : 
             location.pathname.includes('/users') ? t.admin.tabUsers : 
             t.common.welcome}
          </h2>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Link 
              to="/tickets/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              {t.common.newTicket}
            </Link>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
