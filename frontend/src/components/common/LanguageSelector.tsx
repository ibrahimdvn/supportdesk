import { useLanguageStore } from '../../store/useLanguageStore';
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="flex items-center gap-1 bg-neutral-900 border border-border/80 p-0.5 rounded-lg shrink-0">
      <div className="p-1 text-muted-foreground/60 hidden sm:block">
        <Globe className="w-3.5 h-3.5" />
      </div>
      <button
        onClick={() => setLanguage('tr')}
        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
          language === 'tr'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-neutral-800'
        }`}
      >
        TR
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
          language === 'en'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-neutral-800'
        }`}
      >
        EN
      </button>
    </div>
  );
}
