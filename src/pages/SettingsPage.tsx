import React, { useRef, useState } from 'react';
import { Settings, Image as ImageIcon, Bell, BellRing, Check, Database } from 'lucide-react';
import { getSupabaseConfig } from '../lib/supabase';

interface SettingsPageProps {
  activeUser: any;
  myMood: string;
  chatBg: string;
  anniversaryDate: string;
  daysTogether: number;
  notificationsGranted: boolean;
  dbConnected: boolean;
  dbStatusMsg: string;
  onBackToChat: () => void;
  onUpdateDisplayName: (val: string) => void;
  onUpdateMood: (val: string) => void;
  onSelectPresetWallpaper: (preset: 'hearts' | 'clean') => void;
  onUploadBackground: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateAnniversary: (val: string) => void;
  onClearAllMessages: () => void;
  onEnableNotifications: () => void;
  onTestNotification: () => void;
  onSaveSupabaseKeys: (url: string, key: string) => void;
}

export const SettingsPage = React.memo(function SettingsPage({
  activeUser,
  myMood,
  chatBg,
  anniversaryDate,
  daysTogether,
  notificationsGranted,
  dbConnected,
  dbStatusMsg,
  onBackToChat,
  onUpdateDisplayName,
  onUpdateMood,
  onSelectPresetWallpaper,
  onUploadBackground,
  onUpdateAnniversary,
  onClearAllMessages,
  onEnableNotifications,
  onTestNotification,
  onSaveSupabaseKeys
}: SettingsPageProps) {
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => getSupabaseConfig().url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => getSupabaseConfig().anonKey);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#FDF8F8] dark:bg-[#0B1120]">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between border-b border-rose-200/60 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#C8102E]" />
              <span>إعدادات الشات والحساب</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تخصيص اسمك، حالتك، الخلفية المشتركة، وتاريخكما المميز
            </p>
          </div>
          <button
            onClick={onBackToChat}
            className="px-4 py-2 rounded-xl bg-[#C8102E] text-white text-xs font-semibold cursor-pointer"
          >
            العودة للشات
          </button>
        </div>

        {/* 1. Profile Name & Mood Customization */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-rose-100 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#C8102E] dark:text-rose-400">
              1. حسابك الشخصي ({activeUser.name})
            </h3>
            <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
              المستخدم: <strong>{activeUser.username}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">اسم العرض الخاص بك:</label>
              <input
                type="text"
                value={activeUser.name}
                onChange={(e) => onUpdateDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-slate-700 bg-rose-50/30 dark:bg-[#1E2738] text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">حالتك المزاجية الحالية:</label>
              <input
                type="text"
                value={myMood}
                onChange={(e) => onUpdateMood(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-slate-700 bg-rose-50/30 dark:bg-[#1E2738] text-xs"
              />
            </div>
          </div>
        </div>

        {/* 2. Shared Chat Wallpaper Customization */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-rose-100 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#C8102E] dark:text-rose-400">
            2. خلفية الشات المشتركة (تظهر لك ولها في نفس اللحظة)
          </h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <button
              onClick={() => onSelectPresetWallpaper('hearts')}
              className={`p-3 rounded-xl border font-semibold cursor-pointer ${
                chatBg === 'hearts'
                  ? 'border-[#C8102E] bg-rose-50 dark:bg-rose-950/40 text-[#C8102E]'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              خلفية القلوب ♡
            </button>
            <button
              onClick={() => onSelectPresetWallpaper('clean')}
              className={`p-3 rounded-xl border font-semibold cursor-pointer ${
                chatBg === 'clean'
                  ? 'border-[#C8102E] bg-rose-50 dark:bg-rose-950/40 text-[#C8102E]'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              سادة هادئة
            </button>
            <button
              onClick={() => bgFileInputRef.current?.click()}
              className={`p-3 rounded-xl border font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                chatBg === 'custom'
                  ? 'border-[#C8102E] bg-rose-50 dark:bg-rose-950/40 text-[#C8102E]'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>رفع صورة من جهازك</span>
            </button>
          </div>
          <input
            type="file"
            ref={bgFileInputRef}
            onChange={onUploadBackground}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* 3. Relationship Date & Chat Reset */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-rose-100 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#C8102E] dark:text-rose-400">
            3. تاريخ ارتباطكما وإدارة الرسائل
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-semibold block">تاريخ البداية لحساب الأيام:</label>
              <span className="text-[11px] text-slate-400">
                عدد الأيام حالياً: {daysTogether} يوماً معاً ❤️
              </span>
            </div>
            <input
              type="date"
              value={anniversaryDate}
              onChange={(e) => onUpdateAnniversary(e.target.value)}
              className="px-3 py-2 rounded-xl border border-rose-200 dark:border-slate-700 bg-rose-50/30 dark:bg-[#1E2738] text-xs"
            />
          </div>

          <div className="pt-3 border-t border-rose-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold block">مسح الرسائل والبدء من الصفر</span>
              <span className="text-[11px] text-slate-400">
                يحذف كل الرسائل الحالية ليبدأ الشات فارغاً تماماً بينكما
              </span>
            </div>
            <button
              onClick={onClearAllMessages}
              className="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-[#C8102E] dark:text-rose-300 text-xs font-bold hover:bg-red-200 transition cursor-pointer"
            >
              إفراغ المحادثة الآن
            </button>
          </div>
        </div>

        {/* 4. Web & Mobile Notifications Management Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-rose-100 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#C8102E] dark:text-rose-400 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>4. إشعارات الويب وتطبيق الموبايل</span>
            </h3>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                notificationsGranted
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
              }`}
            >
              {notificationsGranted ? 'الإشعارات مفعلة ✓' : 'بانتظار تفعيل الإذن'}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            يصلك إشعار فوري عند استلام أي رسالة جديدة من الطرف الآخر، سواء كنت تستخدم الموقع عبر المتصفح أو تستخدم تطبيق الأندرويد المثبت على هاتفك.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {!notificationsGranted ? (
              <button
                type="button"
                onClick={onEnableNotifications}
                className="px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#a80d26] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>تفعيل الإشعارات الآن</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold py-1">
                <Check className="w-4 h-4" />
                <span>جهازك جاهز لاستقبال الإشعارات</span>
              </div>
            )}

            <button
              type="button"
              onClick={onTestNotification}
              className="px-4 py-2 rounded-xl border border-rose-200 dark:border-slate-700 bg-rose-50/50 dark:bg-[#1E2738] hover:bg-rose-100 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <BellRing className="w-4 h-4 text-[#C8102E]" />
              <span>تجربة إرسال إشعار فوري 🔔</span>
            </button>
          </div>
        </div>

        {/* 5. Supabase Database Connection Settings */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-rose-100 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#C8102E] dark:text-rose-400 flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>5. إعدادات الربط السحابي (Supabase Realtime)</span>
            </h3>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                dbConnected
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
              }`}
            >
              {dbConnected ? 'متصل بالسحابة ✓' : 'بانتظار مفتاح Anon Key'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="block font-semibold mb-1">رابط مشروع Supabase (Project URL):</label>
              <input
                type="text"
                value={supabaseUrlInput}
                onChange={(e) => setSupabaseUrlInput(e.target.value)}
                placeholder="https://mgktuovrhmkjvdqhhwbd.supabase.co"
                className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-slate-700 bg-rose-50/30 dark:bg-[#1E2738]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">مفتاح المشروع (VITE_SUPABASE_ANON_KEY):</label>
              <input
                type="password"
                value={supabaseKeyInput}
                onChange={(e) => setSupabaseKeyInput(e.target.value)}
                placeholder="الصق مفتاح anon public من إعدادات API في Supabase"
                className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-slate-700 bg-rose-50/30 dark:bg-[#1E2738]"
              />
            </div>
            {dbStatusMsg && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{dbStatusMsg}</p>
            )}
            <button
              onClick={() => onSaveSupabaseKeys(supabaseUrlInput.trim(), supabaseKeyInput.trim())}
              className="px-4 py-2 rounded-xl bg-[#C8102E] text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>حفظ وتفعيل التزامن السحابي</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

