import React, { useState } from 'react';
import {
  Heart, Bell, BellRing, Sun, Moon, Sparkles, MessageCircle, Settings, Info, LogOut,
  ArrowLeft, Search, Star, Film, PenTool, Video, Phone, MoreVertical, X, ChevronUp, ChevronDown, Pin
} from 'lucide-react';
import { MOOD_PRESETS } from '../constants/chatData';

// 1. TOP NAVBAR
interface TopNavbarProps {
  daysTogether: number;
  darkMode: boolean;
  notificationsGranted: boolean;
  onToggleDarkMode: () => void;
  onEnableNotifications: () => void;
  onTestNotification: () => void;
}

export const TopNavbar = React.memo(function TopNavbar({
  daysTogether,
  darkMode,
  notificationsGranted,
  onToggleDarkMode,
  onEnableNotifications,
  onTestNotification
}: TopNavbarProps) {
  return (
    <header className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-rose-100 dark:border-slate-800/90 bg-white dark:bg-[#0B1120] shrink-0 z-30">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#C8102E] flex items-center justify-center text-white shadow-sm shadow-red-600/25">
          <Heart className="w-4 h-4 fill-white" />
        </div>
        <span className="font-bold text-lg tracking-tight text-[#8A1527] dark:text-white">
          ChatApp
        </span>
        <span className="hidden sm:inline-block text-[11px] font-medium text-[#C8102E] dark:text-rose-400 bg-rose-50 dark:bg-[#161F35] px-2.5 py-0.5 rounded-full border border-rose-200/60 dark:border-slate-800">
          Just You & Me ♡
        </span>
      </div>

      <div className="flex items-center gap-2">
        {!notificationsGranted ? (
          <button
            type="button"
            onClick={onEnableNotifications}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/70 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition cursor-pointer"
            title="تفعيل الإشعارات ليصلك تنبيه فوري بالرسائل الجديدة"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تفعيل الإشعارات</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onTestNotification}
            className="p-1.5 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="الإشعارات مفعلة ✓ (انقر لتجربة إشعار)"
          >
            <BellRing className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50/80 dark:bg-[#131B2E] border border-rose-200/60 dark:border-slate-800 text-xs font-semibold text-[#C8102E] dark:text-rose-400">
          <Heart className="w-3.5 h-3.5 fill-current" />
          <span>{daysTogether} Days Together</span>
        </div>

        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-[#131B2E] hover:text-[#C8102E] transition cursor-pointer"
          title="الوضع الليلي / النهاري"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
});

// 2. LEFT SIDEBAR
interface ChatSidebarProps {
  mobileScreen: string;
  partnerUser: any;
  partnerOnline: boolean;
  partnerMood: string;
  lastMessage: any;
  isPartnerTyping: boolean;
  unreadCount: number;
  dbConnected: boolean;
  onSelectChat: () => void;
}

export const ChatSidebar = React.memo(function ChatSidebar({
  mobileScreen,
  partnerUser,
  partnerOnline,
  partnerMood,
  lastMessage,
  isPartnerTyping,
  unreadCount,
  dbConnected,
  onSelectChat
}: ChatSidebarProps) {
  return (
    <aside
      className={`w-full md:w-64 lg:w-72 border-r border-rose-100 dark:border-slate-800/80 bg-[#FAF7F7] dark:bg-[#111827] flex-col justify-between shrink-0 ${
        mobileScreen === 'list' ? 'flex h-full' : 'hidden md:flex'
      }`}
    >
      <div className="p-3 space-y-2.5 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            المحادثة الخاصة
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {partnerOnline ? 'متصل الآن' : 'نشط مؤخراً'}
          </span>
        </div>

        <div
          onClick={onSelectChat}
          className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1B2438] border-l-4 border-l-[#C8102E] border border-rose-200/70 dark:border-slate-700/80 shadow-2xs hover:bg-rose-50/60 dark:hover:bg-[#222D45] transition cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {partnerUser.partnerDisplayName}
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 shrink-0">
              {lastMessage?.time || 'Now'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-1">
            <p className="text-[11px] text-slate-500 dark:text-slate-300 truncate">
              {isPartnerTyping ? (
                <span className="text-[#C8102E] dark:text-rose-400 font-medium italic">
                  يكتب الآن...
                </span>
              ) : lastMessage ? (
                lastMessage.text ||
                (lastMessage.type === 'video'
                  ? 'مقطع فيديو 🎥'
                  : lastMessage.type === 'sticker'
                  ? 'صورة / ملصق ❤️'
                  : 'رسالة صوتية 🎤')
              ) : (
                'ابدأ أول رسالة حب بينكما ❤️'
              )}
            </p>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 min-w-[18px] h-[18px] rounded-md bg-[#C8102E] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        <div className="px-3 py-2 rounded-xl bg-rose-50/60 dark:bg-[#161F33] border border-rose-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
          <div className="truncate">
            <span className="text-slate-400 dark:text-slate-500 mr-1">الحالة:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {partnerMood}
            </span>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-[#C8102E] shrink-0" />
        </div>
      </div>

      <div className="p-3 border-t border-rose-100/70 dark:border-slate-800/70 text-center space-y-1">
        <p className="text-[11px] font-medium text-[#9E2A3A] dark:text-rose-300/80 flex items-center justify-center gap-1">
          <Heart className="w-3 h-3 fill-[#C8102E] text-[#C8102E]" />
          <span>مساحة خاصة لشخصين فقط</span>
        </p>
        <p className="text-[10px] text-slate-400">
          {dbConnected ? '🟢 متصل بـ Supabase Realtime' : '🟡 وضع المزامنة المحلية'}
        </p>
      </div>
    </aside>
  );
});

// 3. CHAT SUB-HEADER + SEARCH + PINNED BAR
interface ChatSubHeaderProps {
  partnerUser: any;
  partnerOnline: boolean;
  isPartnerTyping: boolean;
  partnerMood: string;
  starredCount: number;
  isSearchOpen: boolean;
  searchQuery: string;
  searchMatchesCount: number;
  currentMatchIdx: number;
  pinnedMessage: any;
  pinnedSenderName: string;
  onShowMobileList: () => void;
  onToggleSearch: () => void;
  onSearchQueryChange: (q: string) => void;
  onNextSearchMatch: () => void;
  onPrevSearchMatch: () => void;
  onOpenStarred: () => void;
  onOpenSharedMedia: () => void;
  onUpdateMood: (mood: string) => void;
  onOpenCanvas: () => void;
  onOpenCall: (type: 'video' | 'voice') => void;
  onOpenSettings: () => void;
  onJumpToMessage: (id: string) => void;
  onUnpinMessage: (id: string) => void;
}

export const ChatSubHeader = React.memo(function ChatSubHeader({
  partnerUser,
  partnerOnline,
  isPartnerTyping,
  partnerMood,
  starredCount,
  isSearchOpen,
  searchQuery,
  searchMatchesCount,
  currentMatchIdx,
  pinnedMessage,
  pinnedSenderName,
  onShowMobileList,
  onToggleSearch,
  onSearchQueryChange,
  onNextSearchMatch,
  onPrevSearchMatch,
  onOpenStarred,
  onOpenSharedMedia,
  onUpdateMood,
  onOpenCanvas,
  onOpenCall,
  onOpenSettings,
  onJumpToMessage,
  onUnpinMessage
}: ChatSubHeaderProps) {
  const [showMoodDropdown, setShowMoodDropdown] = useState(false);

  return (
    <>
      <div className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-rose-100 dark:border-slate-800/80 bg-white dark:bg-[#131B2E] shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onShowMobileList}
            className="md:hidden p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                {partnerUser.partnerDisplayName}
              </h2>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {isPartnerTyping ? 'يكتب الآن...' : partnerOnline ? 'Online' : 'Active'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-md">
              {partnerMood}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={onToggleSearch}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isSearchOpen
                ? 'bg-[#C8102E] text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800'
            }`}
            title="بحث في الرسائل"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenStarred}
            className="relative p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="الرسائل المميزة بنجمة"
          >
            <Star
              className={`w-4 h-4 ${starredCount > 0 ? 'fill-amber-400 text-amber-400' : ''}`}
            />
            {starredCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSharedMedia}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="معرض الوسائط المشتركة"
          >
            <Film className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMoodDropdown(!showMoodDropdown)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-[#1E2738] border border-rose-200/70 dark:border-slate-700 text-xs font-medium text-[#C8102E] dark:text-rose-300 hover:bg-rose-100 transition cursor-pointer"
              title="تغيير حالتك المزاجية"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>حالتي</span>
            </button>

            {showMoodDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#1E2738] shadow-xl border border-rose-100 dark:border-slate-700 p-2 z-50 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 px-2 block">
                  اختر حالتك لتظهر للطرف الآخر:
                </span>
                {MOOD_PRESETS.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      onUpdateMood(m);
                      setShowMoodDropdown(false);
                    }}
                    className="w-full text-right px-3 py-1.5 rounded-xl text-xs hover:bg-rose-50 dark:hover:bg-slate-800 transition block cursor-pointer"
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onOpenCanvas}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="ارسموا لبعض (Love Canvas)"
          >
            <PenTool className="w-4 h-4 text-[#C8102E]" />
          </button>

          <button
            onClick={() => onOpenCall('video')}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="مكالمة فيديو"
          >
            <Video className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenCall('voice')}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="مكالمة صوتية"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="إعدادات الخلفية والشات"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* IN-CHAT SEARCH BAR */}
      {isSearchOpen && (
        <div className="px-4 py-2 bg-white dark:bg-[#1E2738] border-b border-rose-200/80 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs z-20">
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50/70 dark:bg-[#161F33] border border-rose-200/60 dark:border-slate-700">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onNextSearchMatch();
                if (e.key === 'Escape') onToggleSearch();
              }}
              placeholder="ابحث عن أي كلمة أو ذكرى في الرسائل..."
              className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
                className="p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1">
              {searchMatchesCount > 0
                ? `${currentMatchIdx + 1} من ${searchMatchesCount}`
                : searchQuery
                ? 'لا نتائج'
                : ''}
            </span>
            <button
              type="button"
              onClick={onPrevSearchMatch}
              disabled={searchMatchesCount === 0}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              title="النتيجة السابقة"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextSearchMatch}
              disabled={searchMatchesCount === 0}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              title="النتيجة التالية"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onToggleSearch}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#C8102E] hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
              title="إغلاق البحث"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PINNED MESSAGE BAR */}
      {pinnedMessage && (
        <div className="px-4 py-2 bg-white dark:bg-[#161F33] border-b border-rose-200/70 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs z-10">
          <div
            onClick={() => onJumpToMessage(pinnedMessage.id)}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-[#C8102E] flex items-center justify-center shrink-0">
              <Pin className="w-3.5 h-3.5 fill-[#C8102E]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#C8102E] dark:text-rose-400">
                  رسالة مثبتة • {pinnedSenderName}
                </span>
                <span className="text-[10px] text-slate-400">{pinnedMessage.time}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium">
                {pinnedMessage.text ||
                  (pinnedMessage.type === 'video'
                    ? '🎥 مقطع فيديو'
                    : pinnedMessage.type === 'sticker'
                    ? '🖼️ صورة / ملصق'
                    : '🎤 رسالة صوتية')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onUnpinMessage(pinnedMessage.id)}
            className="p-1.5 rounded-full text-slate-400 hover:text-[#C8102E] hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="إلغاء التثبيت"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
});

// 4. BOTTOM NAVIGATION BAR
interface BottomNavProps {
  activeNav: string;
  unreadCount: number;
  activeUserName: string;
  onNavigate: (page: 'chat' | 'settings' | 'about') => void;
  onLogout: () => void;
}

export const BottomNav = React.memo(function BottomNav({
  activeNav,
  unreadCount,
  activeUserName,
  onNavigate,
  onLogout
}: BottomNavProps) {
  return (
    <footer className="h-13 px-4 md:px-6 bg-white dark:bg-[#0B1120] border-t border-rose-100 dark:border-slate-800/90 flex items-center justify-between shrink-0 z-30">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => onNavigate('chat')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeNav === 'chat'
              ? 'bg-[#C8102E] text-white shadow-xs shadow-red-600/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-[#131B2E]'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>My Chat</span>
          {unreadCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeNav === 'chat' ? 'bg-white/25 text-white' : 'bg-[#C8102E] text-white'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeNav === 'settings'
              ? 'bg-[#C8102E] text-white shadow-xs shadow-red-600/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-[#131B2E]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>

        <button
          onClick={() => onNavigate('about')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeNav === 'about'
              ? 'bg-[#C8102E] text-white shadow-xs shadow-red-600/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-[#131B2E]'
          }`}
        >
          <Info className="w-4 h-4" />
          <span className="hidden sm:inline">About</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {activeUserName}
          </span>
          <span className="hidden sm:inline text-[11px] text-slate-400">
            (Online)
          </span>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-[#131B2E] hover:text-[#C8102E] transition cursor-pointer"
          title="تسجيل الخروج من الحساب"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">خروج</span>
        </button>
      </div>
    </footer>
  );
});

