import { useNavigate, Link } from 'react-router-dom';
import { Ticket, ArrowRight, Shield, Zap, Activity, Users, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import LanguageSelector from '../components/common/LanguageSelector';

export default function Welcome() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { t } = useLanguageStore();

  const handlePortalEntry = (mode: 'employee' | 'admin') => {
    if (isAuthenticated) {
      if (user?.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/login', { state: { adminMode: mode === 'admin' } });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-between">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-border/40 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Ticket className="w-5.5 h-5.5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            SupportDesk
          </span>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSelector />
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden md:inline-block">
                {t.welcome.loggedInAs} <strong className="text-foreground">{user?.name}</strong>
              </span>
              <button
                onClick={() => handlePortalEntry(user?.role === 'Admin' ? 'admin' : 'employee')}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary/15 border border-primary/30 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-all"
              >
                {t.welcome.goToPortal}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-border text-foreground rounded-lg text-xs font-semibold transition-all"
            >
              {t.common.login}
            </Link>
          )}
        </div>
      </header>

      {/* Hero Body */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center justify-center text-center z-10">
        {/* Premium Tagline */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
          <Zap className="w-3.5 h-3.5" />
          {t.welcome.tagline}
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] max-w-3xl mb-6">
          {t.welcome.title}{' '}
          <span className="bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent">
            {t.common.language === 'Language' ? 'Reimagined.' : 'Yeniden Tasarlandı.'}
          </span>
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mb-12 leading-relaxed">
          {t.welcome.subtitle}
        </p>

        {/* Portal CTAs */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl mb-16">
          {/* Employee/Customer Card */}
          <div 
            onClick={() => handlePortalEntry('employee')}
            className="group glass-panel p-6 text-left border border-border/60 hover:border-primary/40 hover:bg-primary/[0.02] cursor-pointer transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
            <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-1.5">
              {t.welcome.employeeTitle}
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.welcome.employeeDesc}
            </p>
          </div>

          {/* Admin/Agent Card */}
          <div 
            onClick={() => handlePortalEntry('admin')}
            className="group glass-panel p-6 text-left border border-border/60 hover:border-purple-500/40 hover:bg-purple-500/[0.02] cursor-pointer transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
            <div className="w-11 h-11 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-1.5">
              {t.welcome.adminTitle}
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.welcome.adminDesc}
            </p>
          </div>
        </div>

        {/* SLA & Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl border-t border-border/30 pt-10">
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/10 border border-border/20">
            <CheckCircle2 className="w-5 h-5 text-green-400 mb-2" />
            <span className="text-lg font-extrabold text-foreground leading-none mb-1">99.9%</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t.welcome.slaAdherence}</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/10 border border-border/20">
            <Zap className="w-5 h-5 text-yellow-400 mb-2" />
            <span className="text-lg font-extrabold text-foreground leading-none mb-1">&lt; 15 Min</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t.welcome.avgResponse}</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/10 border border-border/20">
            <Users className="w-5 h-5 text-blue-400 mb-2" />
            <span className="text-lg font-extrabold text-foreground leading-none mb-1">100%</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t.welcome.collabTriage}</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/10 border border-border/20">
            <Activity className="w-5 h-5 text-purple-400 mb-2" />
            <span className="text-lg font-extrabold text-foreground leading-none mb-1">
              {t.common.language === 'Language' ? 'Active' : 'Aktif'}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t.welcome.systemTriage}</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/40 py-6 text-center text-xs text-muted-foreground shrink-0 z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            &copy; {new Date().getFullYear()} SupportDesk Inc. {t.common.language === 'Language' ? 'All rights reserved.' : 'Tüm hakları saklıdır.'}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-semibold text-foreground">{t.common.allSystemsOperational}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
