import { create } from 'zustand';
import { translations } from '../locales/translations';
import type { Language } from '../locales/translations';

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : string;
};

export type TranslationType = DeepStringify<typeof translations['en']>;

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationType;
}

const getInitialLanguage = (): Language => {
  const saved = localStorage.getItem('supportdesk_lang');
  if (saved === 'en' || saved === 'tr') {
    return saved;
  }
  return 'tr'; // Default to Turkish as requested
};

const initialLang = getInitialLanguage();

export const useLanguageStore = create<LanguageState>((set) => ({
  language: initialLang,
  setLanguage: (lang: Language) => {
    localStorage.setItem('supportdesk_lang', lang);
    set({ language: lang, t: translations[lang] as unknown as TranslationType });
  },
  t: translations[initialLang] as unknown as TranslationType
}));
