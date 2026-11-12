import React, { useState } from 'react';
import { Heart, Sun, Moon, User, KeyRound, ShieldCheck, Lock } from 'lucide-react';

interface LoginPageProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onLogin: (username: string, pin: string) => Promise<string | null>;
}

export const LoginPage = React.memo(function LoginPage({
  darkMode,
  setDarkMode,
  onLogin
}: LoginPageProps) {
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');
    const err = await onLogin(loginUsername, loginPin);
    if (err) {
      setLoginError(err);
    }
    setIsSubmitting(false);
  };

  return (
    <div
      className={`w-full min-h-screen flex items-center justify-center p-4 font-sans transition-colors ${
        darkMode ? 'bg-[#0D1321] text-white' : 'bg-[#FDF4F5] text-slate-900'
      }`}
    >
      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-rose-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-7 sm:p-9 relative">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="absolute top-5 right-5 p-2.5 rounded-full bg-rose-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#C8102E] transition"
          title="تبديل الوضع الليلي"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#C8102E] to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30 mb-3">
            <Heart className="w-9 h-9 fill-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            ChatApp
          </h1>
          <p className="text-xs font-medium text-[#C8102E] dark:text-rose-400 mt-1 flex items-center gap-1">
            <span>Just You & Me ♡</span>
            <span>•</span>
            <span>مساحة خاصة لشخصين فقط</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم المستخدم (الخاص بك)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="ادخل اسمك (مثال: ali أو love)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-rose-200 dark:border-slate-700 bg-rose-50/40 dark:bg-[#1E2738] text-slate-900 dark:text-white focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              الرمز السري (PIN)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                placeholder="••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-rose-200 dark:border-slate-700 bg-rose-50/40 dark:bg-[#1E2738] text-slate-900 dark:text-white focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition"
              />
            </div>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-[#C8102E] dark:text-rose-300 font-medium text-center">
              {loginError}
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 py-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>سيتم تذكر حسابك تلقائياً على هذا الجهاز دون الحاجة لتسجيل الدخول مرة أخرى.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-[#C8102E] hover:bg-[#a80d26] disabled:opacity-60 text-white font-semibold text-sm shadow-lg shadow-red-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>{isSubmitting ? 'جاري الدخول...' : 'تسجيل الدخول إلى عالمنا ♡'}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-rose-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={() => setShowLoginHint(!showLoginHint)}
            className="text-[11px] text-slate-400 hover:text-[#C8102E] transition underline"
          >
            {showLoginHint ? 'إخفاء بيانات الحسابين' : 'عرض بيانات الحسابين الافتراضية للتجربة'}
          </button>

          {showLoginHint && (
            <div className="mt-3 p-3 rounded-2xl bg-rose-50/70 dark:bg-[#1E2738]/70 border border-rose-200/60 dark:border-slate-700 text-xs space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  1. حسابك أنت (Ali):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername('ali');
                    setLoginPin('1234');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#C8102E] text-white text-[11px] font-medium"
                >
                  ملء تلقائي (ali / 1234)
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  2. حساب حبيبتك (My Love):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername('love');
                    setLoginPin('1234');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-medium"
                >
                  ملء تلقائي (love / 1234)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

