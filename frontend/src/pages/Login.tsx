import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Ticket, LogIn, Shield, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import LanguageSelector from '../components/common/LanguageSelector';
import api from '../lib/axios';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { adminMode?: boolean } | null;
  const { t } = useLanguageStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(state?.adminMode || false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.user, response.data.token);
      toast.success(t.common.success);
      if (isAdminMode) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || t.common.error);
      } else {
        toast.error(t.common.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsAdminMode(!isAdminMode);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Floating Back to Welcome Button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/60 border border-border hover:bg-neutral-800 text-muted-foreground hover:text-foreground rounded-lg text-sm font-medium transition-all group backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t.common.language === 'Language' ? 'Back' : 'Geri'}
        </button>
      </div>

      {/* Floating Language Selector */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAdminMode ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
            {isAdminMode ? <Shield className="w-8 h-8" /> : <Ticket className="w-8 h-8" />}
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          {isAdminMode ? t.login.adminTitle : t.login.employeeTitle}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {isAdminMode ? (
            <button onClick={handleToggleMode} className="font-medium text-primary hover:text-primary/80 transition-colors">
              {t.login.backToEmployee}
            </button>
          ) : (
            <>
              {t.login.or}{' '}
              <Link to="/register" className="font-medium text-primary hover:text-primary/80">
                {t.login.createAccount}
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel py-8 px-4 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-foreground">
                {isAdminMode ? t.login.usernameLabel : t.login.emailLabel}
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-md bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
                  placeholder={isAdminMode ? t.login.usernameLabel : 'you@example.com'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                {t.login.passwordLabel}
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-md bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    {t.login.signingIn}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    {isAdminMode ? t.login.adminTitle : t.common.login}
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleToggleMode}
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-primary/20 rounded-md shadow-sm text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-all disabled:opacity-50"
            >
              <Shield className="w-4 h-4" />
              {isAdminMode ? t.login.backToEmployee : t.login.adminTitle}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
