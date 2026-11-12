import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Heart, Send, Smile, Paperclip, Mic, Image as ImageIcon,
  Settings, Info, Trash2, Edit3, CornerUpLeft, MoreVertical,
  Phone, Video, Moon, Sun, X, Check, CheckCheck,
  Sparkles, PenTool, Plus, LogOut, ArrowLeft,
  Lock, User, KeyRound, MessageCircle, Database, ShieldCheck, Play, Pause,
  Pin, PinOff, Star, Search, ChevronDown, ChevronUp, Copy, Film, Volume2,
  Bell, BellRing
} from 'lucide-react';
import { getSupabaseClient, getSupabaseConfig, uploadMediaToStorage } from './lib/supabase';
import {
  initNotificationChannel,
  requestNotificationPermission,
  checkNotificationPermission,
  sendIncomingMessageNotification
} from './lib/notifications';

// Private Pre-Configured Couple Accounts
const COUPLE_ACCOUNTS: Record<string, any> = {
  user1: {
    id: 'user1',
    username: 'ali',
    pin: '1234',
    name: 'Ali',
    partnerDisplayName: 'Ali ♡',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    defaultMood: 'في الشغل 💻'
  },
  user2: {
    id: 'user2',
    username: 'love',
    pin: '1234',
    name: 'My Love ♡',
    partnerDisplayName: 'My Love ♡',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    defaultMood: 'مشتاقة لك ❤️'
  }
};

const USERNAME_TO_ID: Record<string, string> = {
  ali: 'user1',
  love: 'user2'
};

const ID_TO_USERNAME: Record<string, string> = {
  user1: 'ali',
  user2: 'love'
};

const MOOD_PRESETS = [
  'بيفكر فيك ❤️',
  'مشتاقلك أوي 🥺',
  'في الشغل 💻',
  'نايم 😴',
  'بسمع مزيكا 🎶',
  'مستني رسالتك 💌',
  'بحبك قد الدنيا 🌎❤️'
];

// Preset Romantic Stickers
const INITIAL_STICKERS = [
  'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=240&auto=format&fit=crop&q=80'
];

// Rich Emoji Categories
const EMOJI_CATEGORIES = [
  {
    id: 'people',
    label: 'Emoji & People',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '🥹', '😅',
      '😂', '🤣', '🥲', '☺️', '😊', '😇', '🙂',
      '🙃', '😉', '😌', '😍', '🥰', '😘', '😗',
      '😙', '😚', '😋', '😛', '😝', '😜', '🤪',
      '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳',
      '😏', '😒', '😞', '😔', '😟', '😕', '🙁',
      '😣', '😖', '😫', '😩', '🥺', '😢', '😭',
      '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵'
    ]
  },
  {
    id: 'hearts',
    label: 'Love & Hearts',
    icon: '❤️',
    emojis: [
      '❤️', '🤍', '💖', '💗', '💓', '💞', '💕',
      '❣️', '💔', '❤️‍🔥', '❤️‍🩹', '💘', '💝', '💟',
      '💌', '💋', '💍', '💎', '🌹', '🌷', '💐',
      '🌺', '🌸', '🫂', '👩‍❤️‍👨', '💑', '🫶', '✨'
    ]
  },
  {
    id: 'gestures',
    label: 'Gestures & Hands',
    icon: '👍',
    emojis: [
      '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇',
      '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝',
      '🙏', '💪', '👏', '🙌', '👐', '🤲', '💅'
    ]
  },
  {
    id: 'treats',
    label: 'Sweets & Celebration',
    icon: '🎂',
    emojis: [
      '🎂', '🍰', '🧁', '🍫', '🍬', '🍭', '🍓',
      '🍒', '🍑', '🍦', '🍩', '🍪', '☕', '🧋',
      '🍕', '🍔', '🍟', '🎁', '🎈', '🎉', '🎊',
      '🧸', '🌙', '⭐', '☀️', '🌈', '🔥', '🎶'
    ]
  }
];

function formatTimeFromISO(isoString?: string) {
  const date = isoString ? new Date(isoString) : new Date();
  if (isNaN(date.getTime())) return 'Now';
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function dataURLtoBlob(dataurl: string): Blob | null {
  try {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/webp';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
}

// WhatsApp-style Intelligent Date Grouping
function getMessageDateGroup(timestamp?: number): string {
  if (!timestamp) return 'اليوم';
  const msgDate = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
  const diffDays = Math.round((today.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'اليوم';
  if (diffDays === 1) return 'أمس';

  return msgDate.toLocaleDateString('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: msgDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// Telegram & WhatsApp Rich Text Formatter with Telegram Spoilers & Search Highlight
const FormattedMessageText = React.memo(function FormattedMessageText({
  text,
  searchQuery
}: {
  text: string;
  searchQuery?: string;
}) {
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<number, boolean>>({});

  // Tokenize Telegram spoilers (||secret||), *bold*, _italic_, ~strike~
  const parts = useMemo(() => {
    return text.split(/(\|\|[\s\S]*?\|\||\*[^\s*][^*]*?[^\s*]\*|_[^\s_][^_]*?[^\s_]_|~[^\s~][^~]*?[^\s~]~)/g);
  }, [text]);

  const renderHighlighted = (content: string, keyPrefix: string | number) => {
    if (!searchQuery || !searchQuery.trim()) return content;
    const q = searchQuery.trim();
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const subParts = content.split(regex);

    return subParts.map((sub, i) => {
      if (sub.toLowerCase() === q.toLowerCase()) {
        return (
          <mark
            key={`${keyPrefix}-${i}`}
            className="bg-amber-300 dark:bg-amber-500 text-slate-900 font-bold px-0.5 rounded-xs"
          >
            {sub}
          </mark>
        );
      }
      return sub;
    });
  };

  return (
    <span className="text-sm leading-relaxed break-words whitespace-pre-wrap select-text">
      {parts.map((part, idx) => {
        if (!part) return null;

        // Telegram Spoiler: ||spoiler||
        if (part.startsWith('||') && part.endsWith('||') && part.length >= 4) {
          const secret = part.slice(2, -2);
          const isRevealed = revealedSpoilers[idx];
          return (
            <span
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setRevealedSpoilers((prev) => ({ ...prev, [idx]: !prev[idx] }));
              }}
              className={isRevealed ? 'spoiler-revealed' : 'spoiler-hidden'}
              title={isRevealed ? '' : 'انقر لكشف السر 🤫'}
            >
              {renderHighlighted(secret, `sp-${idx}`)}
            </span>
          );
        }

        // WhatsApp Bold: *bold*
        if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
          return (
            <strong key={idx} className="font-bold">
              {renderHighlighted(part.slice(1, -1), `b-${idx}`)}
            </strong>
          );
        }

        // WhatsApp Italic: _italic_
        if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
          return (
            <em key={idx} className="italic">
              {renderHighlighted(part.slice(1, -1), `i-${idx}`)}
            </em>
          );
        }

        // WhatsApp Strikethrough: ~strike~
        if (part.startsWith('~') && part.endsWith('~') && part.length >= 2) {
          return (
            <del key={idx} className="line-through opacity-75">
              {renderHighlighted(part.slice(1, -1), `s-${idx}`)}
            </del>
          );
        }

        return <React.Fragment key={idx}>{renderHighlighted(part, `txt-${idx}`)}</React.Fragment>;
      })}
    </span>
  );
});

export default function App() {
  // 1. PERSISTENT SINGLE-ACCOUNT AUTHENTICATION STATE
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(() => {
    return localStorage.getItem('couples_chat_auth_user') || null;
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginHint, setShowLoginHint] = useState(false);

  // SUPABASE CONFIG & REALTIME CONNECTION STATE
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => getSupabaseConfig().url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => getSupabaseConfig().anonKey);
  const [dbConnected, setDbConnected] = useState(false);
  const [dbStatusMsg, setDbStatusMsg] = useState('');
  const [partnerOnline, setPartnerOnline] = useState(true);

  // 2. THEME & NAVIGATION STATE
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('romantic_chat_theme') === 'dark';
  });
  const [activeNav, setActiveNav] = useState('chat'); // 'chat' | 'settings' | 'about'
  const [mobileScreen, setMobileScreen] = useState('chat'); // 'list' | 'chat' | 'settings' | 'about'

  // 3. CUSTOM PROFILES & MOODS (Shared between both accounts)
  const [profiles, setProfiles] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('romantic_chat_profiles');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return COUPLE_ACCOUNTS;
  });

  const [partnerMoods, setPartnerMoods] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('romantic_chat_moods');
    return saved ? JSON.parse(saved) : {
      user1: 'في الشغل 💻',
      user2: 'مشتاقة لك ❤️'
    };
  });

  const [anniversaryDate, setAnniversaryDate] = useState(() => {
    return localStorage.getItem('romantic_chat_anniversary') || '2024-01-01';
  });

  // 4. SHARED WALLPAPER & APPEARANCE
  const [chatBg, setChatBg] = useState(() => {
    return localStorage.getItem('romantic_chat_bg') || 'hearts';
  });
  const [customBgUrl, setCustomBgUrl] = useState(() => {
    return localStorage.getItem('romantic_chat_custom_bg') || '';
  });
  const [bgOverlayOpacity, setBgOverlayOpacity] = useState(() => {
    return Number(localStorage.getItem('romantic_chat_bg_opacity') || 20);
  });

  // 5. SHARED STICKERS DRAWER
  const [stickers, setStickers] = useState<string[]>(() => {
    const saved = localStorage.getItem('romantic_chat_stickers');
    return saved ? JSON.parse(saved) : INITIAL_STICKERS;
  });

  // 6. MESSAGES STATE (Clean — No Dummy Data)
  const [messages, setMessages] = useState<any[]>(() => {
    localStorage.removeItem('romantic_chat_messages_v2');
    const saved = localStorage.getItem('couples_chat_messages_live');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [];
  });

  // 7. COMPOSER & INTERACTIVE UI STATES
  const [inputText, setInputText] = useState('');
  const [showMediaDrawer, setShowMediaDrawer] = useState(false);
  const [mediaDrawerTab, setMediaDrawerTab] = useState<'emojis' | 'stickers'>('emojis');
  const [activeEmojiCat, setActiveEmojiCat] = useState('people');
  const [showMoodDropdown, setShowMoodDropdown] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [activeMessageActionId, setActiveMessageActionId] = useState<string | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [soundEnabled] = useState(true);
  const [activeCallModal, setActiveCallModal] = useState<string | null>(null);
  const [pastedMedia, setPastedMedia] = useState<{
    file: File;
    previewUrl: string;
    isVideo: boolean;
  } | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  // Swipe-to-reply touch gesture state
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    if (!touchStartPos.current) return;
    const deltaX = e.touches[0].clientX - touchStartPos.current.x;
    const deltaY = e.touches[0].clientY - touchStartPos.current.y;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
      const clamped = Math.sign(deltaX) * Math.min(Math.abs(deltaX), 75);
      setSwipingId(id);
      setSwipeOffset(clamped);
    }
  };

  const handleTouchEnd = (msg: any) => {
    if (swipingId === msg.id && Math.abs(swipeOffset) >= 40) {
      setReplyingTo(msg);
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(25);
        }
      } catch {}
    }
    setSwipingId(null);
    setSwipeOffset(0);
    touchStartPos.current = null;
  };

  // Voice Note Recorder State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Love Doodle Canvas State
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#C8102E');
  const [penWidth] = useState(4);

  // Refs
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);
  const stickerFileInputRef = useRef<HTMLInputElement | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const supabaseChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);

  // 8. TELEGRAM & WHATSAPP ADVANCED FEATURES STATE
  // A. Pinned Messages (WhatsApp / Telegram style)
  const [pinnedMsgId, setPinnedMsgId] = useState<string | null>(() => {
    return localStorage.getItem('romantic_chat_pinned_id') || null;
  });

  // B. Starred Messages (WhatsApp / Telegram "Saved Memories")
  const [starredMsgIds, setStarredMsgIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('romantic_chat_starred_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showStarredModal, setShowStarredModal] = useState(false);

  // C. In-Chat Realtime Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  // D. Smart Scroll-To-Bottom with Unread Count Badge
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [newUnseenCount, setNewUnseenCount] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // E. Voice Message Player 2.0 (Speed 1x / 1.5x / 2x + Duration tracker)
  const [voicePlaybackSpeed, setVoicePlaybackSpeed] = useState<number>(1);
  const [audioProgress, setAudioProgress] = useState<Record<string, { current: number; total: number }>>({});
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // F. Telegram Animated Reaction Burst (Hearts explosion)
  const [floatingParticles, setFloatingParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    tx: number;
    rot: number;
    char: string;
  }>>([]);

  // G. Highlighted Jumped-To Message
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  // H. Sweet Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // I. Shared Media Gallery Modal
  const [showSharedMediaModal, setShowSharedMediaModal] = useState(false);
  const [sharedMediaTab, setSharedMediaTab] = useState<'media' | 'voice' | 'stickers'>('media');

  // Stable Refs for Zero-Lag Performance & Notification Deduplication
  const profilesRef = useRef(profiles);
  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  const notifiedMsgIdsRef = useRef<Set<string>>(new Set());
  const isCurrentlyTypingRef = useRef(false);

  // Pre-seed notified IDs so existing historical messages never trigger alerts
  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach((m) => {
        if (m.id) notifiedMsgIdsRef.current.add(m.id);
      });
    }
  }, [messages.length]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  const jumpToMessage = useCallback((msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(msgId);
      setTimeout(() => {
        setHighlightedMsgId(null);
      }, 2200);
    }
  }, []);

  const triggerReactionBurst = useCallback((x: number, y: number, emoji = '❤️') => {
    const chars = emoji === '❤️'
      ? ['❤️', '💖', '💕', '✨', '🌹', '🥰', '💓']
      : emoji === '🔥'
      ? ['🔥', '✨', '⚡', '💥', '❤️']
      : [emoji, '✨', '💫', '💖'];

    const newParticles = Array.from({ length: 14 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 30,
      tx: (Math.random() - 0.5) * 130,
      rot: (Math.random() - 0.5) * 60,
      char: chars[Math.floor(Math.random() * chars.length)]
    }));

    setFloatingParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setFloatingParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 1600);
  }, []);

  const handleTogglePinMessage = useCallback((msgId: string) => {
    setPinnedMsgId((prev) => {
      const next = prev === msgId ? null : msgId;
      if (next) {
        localStorage.setItem('romantic_chat_pinned_id', next);
      } else {
        localStorage.removeItem('romantic_chat_pinned_id');
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: 'SYNC_PINNED', payload: { pinnedId: next } });
      }
      if (supabaseChannelRef.current) {
        supabaseChannelRef.current.send({
          type: 'broadcast',
          event: 'SYNC_PINNED',
          payload: { pinnedId: next }
        });
      }
      showToast(next ? 'تم تثبيت الرسالة في أعلى المحادثة 📌' : 'تم إلغاء تثبيت الرسالة');
      return next;
    });
    setActiveMessageActionId(null);
  }, [showToast]);

  const handleToggleStarMessage = useCallback((msgId: string) => {
    setStarredMsgIds((prev) => {
      const exists = prev.includes(msgId);
      const next = exists ? prev.filter((id) => id !== msgId) : [...prev, msgId];
      localStorage.setItem('romantic_chat_starred_ids', JSON.stringify(next));
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: 'SYNC_STARRED', payload: { starredIds: next } });
      }
      if (supabaseChannelRef.current) {
        supabaseChannelRef.current.send({
          type: 'broadcast',
          event: 'SYNC_STARRED',
          payload: { starredIds: next }
        });
      }
      showToast(exists ? 'تمت إزالة النجمة ⭐' : 'تم حفظ الرسالة في ذكرياتكما المميزة ⭐');
      return next;
    });
    setActiveMessageActionId(null);
  }, [showToast]);

  const handleCopyMessage = useCallback((text?: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      showToast('تم نسخ نص الرسالة إلى الحافظة 📋');
    } catch {
      showToast('تعذر النسخ تلقائياً');
    }
    setActiveMessageActionId(null);
  }, [showToast]);

  const cycleVoiceSpeed = useCallback(() => {
    const speeds = [1, 1.5, 2];
    setVoicePlaybackSpeed((prev) => {
      const next = speeds[(speeds.indexOf(prev) + 1) % speeds.length];
      if (activeAudioRef.current) {
        activeAudioRef.current.playbackRate = next;
      }
      showToast(`تم ضبط سرعة الصوت على ${next}x ⚡`);
      return next;
    });
  }, [showToast]);

  // Search matches memo
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return messages
      .filter((m) => m.type === 'text' && m.text && m.text.toLowerCase().includes(q))
      .map((m) => m.id);
  }, [messages, searchQuery]);

  // Auto-jump to current search match
  useEffect(() => {
    if (searchMatches.length > 0) {
      const targetId = searchMatches[currentMatchIdx] || searchMatches[0];
      if (targetId) jumpToMessage(targetId);
    }
  }, [searchMatches, currentMatchIdx, jumpToMessage]);

  const handleNextSearchMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIdx + 1) % searchMatches.length;
    setCurrentMatchIdx(nextIdx);
  };

  const handlePrevSearchMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIdx - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIdx(prevIdx);
  };

  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    const isScrolledUp = distanceToBottom > 160;
    setShowScrollBottom(isScrolledUp);
    if (!isScrolledUp) {
      setNewUnseenCount(0);
    }
  };

  // 9. WEB & MOBILE NOTIFICATIONS STATE & HANDLERS
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  useEffect(() => {
    initNotificationChannel();
    checkNotificationPermission().then(setNotificationsGranted);
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsGranted(granted);
    if (granted) {
      showToast('تم تفعيل الإشعارات بنجاح 🔔❤️');
      sendIncomingMessageNotification({
        title: 'ChatApp ♡',
        body: 'تم تفعيل الإشعارات بنجاح! ستصلك رسائل حبيبك فوراً ❤️'
      });
    } else {
      showToast('لم يتم منح إذن الإشعارات، يمكنك تفعيلها من إعدادات المتصفح أو الهاتف');
    }
  };

  const handleTestNotification = async () => {
    const granted = await checkNotificationPermission();
    if (!granted) {
      await handleEnableNotifications();
    } else {
      const partnerId = loggedInUserId === 'user1' ? 'user2' : 'user1';
      const partnerName = profiles[partnerId]?.name || 'My Love ♡';
      sendIncomingMessageNotification({
        title: `${partnerName} ♡`,
        body: 'إشعار تجريبي: بحبك ومستني رسالتك دلوقتي ❤️'
      });
      showToast('تم إرسال إشعار تجريبي لجهازك الآن 🔔✨');
    }
  };

  // Sound Synthesizer
  const playSound = useCallback((type = 'send') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'send' ? 540 : 720, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Ignore AudioContext blocks
    }
  }, [soundEnabled]);

  // Convert DB message row to UI message object
  const mapDbMessageToUi = useCallback((row: any, allRows: any[], currentProfiles: Record<string, any>) => {
    const senderId = USERNAME_TO_ID[row.sender] || (row.sender === 'love' ? 'user2' : 'user1');
    let replyToObj = null;
    if (row.reply_to_id) {
      const parent = allRows.find((r) => r.id === row.reply_to_id);
      if (parent) {
        const parentSenderId = USERNAME_TO_ID[parent.sender] || 'user1';
        replyToObj = {
          id: parent.id,
          senderId: parentSenderId,
          senderName: currentProfiles[parentSenderId]?.name || parent.sender,
          snippet:
            parent.type === 'text'
              ? parent.content
              : parent.type === 'video'
              ? '🎥 مقطع فيديو'
              : parent.type === 'sticker' || parent.type === 'image'
              ? '🖼️ صورة / ملصق'
              : '🎤 رسالة صوتية'
        };
      }
    }

    let voiceDuration = 3;
    let audioDataUrl = row.content;
    if (row.type === 'voice' && row.content) {
      try {
        if (row.content.startsWith('{')) {
          const parsed = JSON.parse(row.content);
          voiceDuration = parsed.duration || 3;
          audioDataUrl = parsed.url || '';
        }
      } catch {
        // plain URL
      }
    }

    const normalizedType = row.type === 'image' ? 'sticker' : row.type || 'text';

    return {
      id: row.id,
      senderId,
      type: normalizedType,
      text: normalizedType === 'text' ? row.content : undefined,
      stickerUrl: normalizedType === 'sticker' ? row.content : undefined,
      videoUrl: normalizedType === 'video' ? row.content : undefined,
      audioDataUrl: normalizedType === 'voice' ? audioDataUrl : undefined,
      voiceDuration: normalizedType === 'voice' ? voiceDuration : undefined,
      time: formatTimeFromISO(row.created_at),
      timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      status: row.is_read ? 'read' : 'sent',
      edited: Boolean(row.is_edited),
      reactions: Array.isArray(row.reactions) ? row.reactions : [],
      replyTo: replyToObj
    };
  }, []);

  // Fetch all data from Supabase
  const fetchSupabaseData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setDbConnected(false);
      return;
    }

    try {
      // 1. Fetch app_users
      const { data: usersData, error: usersErr } = await supabase
        .from('app_users')
        .select('*');

      if (usersErr) {
        setDbConnected(false);
        setDbStatusMsg(`خطأ في الاتصال بجدول app_users: ${usersErr.message}`);
        return;
      }

      setDbConnected(true);
      setDbStatusMsg('متصل بقاعدة بيانات Supabase بنجاح ✓');

      let updatedProfiles = { ...COUPLE_ACCOUNTS };
      const updatedMoods: Record<string, string> = {
        user1: 'في الشغل 💻',
        user2: 'مشتاقة لك ❤️'
      };

      if (usersData && usersData.length > 0) {
        usersData.forEach((u: any) => {
          const uid = USERNAME_TO_ID[u.username];
          if (uid) {
            updatedProfiles[uid] = {
              ...updatedProfiles[uid],
              username: u.username,
              pin: u.pin_code || '1234',
              name: u.display_name || updatedProfiles[uid].name,
              partnerDisplayName: u.display_name?.includes('♡')
                ? u.display_name
                : `${u.display_name} ♡`
            };
            if (u.mood_text) {
              updatedMoods[uid] = u.mood_text;
            }
            if (loggedInUserId && uid !== loggedInUserId) {
              setPartnerOnline(Boolean(u.is_online));
            }
          }
        });
        setProfiles((prev) => {
          const prevJson = JSON.stringify(prev);
          const nextJson = JSON.stringify(updatedProfiles);
          return prevJson === nextJson ? prev : updatedProfiles;
        });
        setPartnerMoods((prev) => {
          const prevJson = JSON.stringify(prev);
          const nextJson = JSON.stringify(updatedMoods);
          return prevJson === nextJson ? prev : updatedMoods;
        });
      }

      // 2. Fetch chat_settings
      const { data: settingsData } = await supabase
        .from('chat_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (settingsData) {
        if (settingsData.relationship_start_date) {
          setAnniversaryDate(settingsData.relationship_start_date);
        }
        const wp = settingsData.wallpaper_url || '';
        if (wp === '' || wp === 'hearts') {
          setChatBg('hearts');
        } else if (wp === 'clean') {
          setChatBg('clean');
        } else {
          setChatBg('custom');
          setCustomBgUrl(wp);
        }
      }

      // 3. Fetch custom_stickers
      const { data: stickersData } = await supabase
        .from('custom_stickers')
        .select('*')
        .order('created_at', { ascending: false });

      if (stickersData && stickersData.length > 0) {
        const dbStickerUrls = stickersData.map((s: any) => s.url);
        setStickers([...dbStickerUrls, ...INITIAL_STICKERS]);
      }

      // 4. Fetch messages
      const { data: msgsData } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (msgsData) {
        msgsData.forEach((r: any) => {
          if (r.id) notifiedMsgIdsRef.current.add(r.id);
        });
        const mapped = msgsData.map((r: any) => mapDbMessageToUi(r, msgsData, updatedProfiles));
        setMessages((prev) => {
          const pendingUploads = prev.filter(
            (m) => m.isUploading && !mapped.some((dbMsg: any) => dbMsg.id === m.id)
          );
          return [...mapped, ...pendingUploads];
        });
      }
    } catch (err: any) {
      console.warn('Supabase fetch error:', err);
      setDbConnected(false);
    }
  }, [loggedInUserId, mapDbMessageToUi]);

  // Connect to Supabase Realtime & BroadcastChannel
  useEffect(() => {
    fetchSupabaseData();

    const supabase = getSupabaseClient();
    if (supabase) {
      // Mark current user online in app_users
      if (loggedInUserId) {
        const myUsername = ID_TO_USERNAME[loggedInUserId];
        supabase
          .from('app_users')
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq('username', myUsername)
          .then();
      }

      const channel = supabase
        .channel('couples_supabase_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          (payload: any) => {
            fetchSupabaseData();

            // Send notification to Web or Android device if message is from the partner
            if (payload && payload.eventType === 'INSERT' && payload.new) {
              const newRow = payload.new;
              const myUsername = loggedInUserId ? ID_TO_USERNAME[loggedInUserId] : '';
              if (newRow.sender && newRow.sender !== myUsername) {
                if (!notifiedMsgIdsRef.current.has(newRow.id)) {
                  notifiedMsgIdsRef.current.add(newRow.id);
                  playSound('receive');
                  const partnerId = loggedInUserId === 'user1' ? 'user2' : 'user1';
                  const partnerName = profilesRef.current[partnerId]?.name || 'My Love ♡';
                  let snippet = newRow.content;
                  if (newRow.type === 'video') snippet = '🎥 أرسل مقطع فيديو جديد';
                  else if (newRow.type === 'sticker' || newRow.type === 'image') snippet = '🖼️ أرسل صورة / ملصق حب جديد';
                  else if (newRow.type === 'voice') snippet = '🎤 أرسل رسالة صوتية جديدة';

                  sendIncomingMessageNotification({
                    id: newRow.id,
                    title: `${partnerName} ♡`,
                    body: snippet || 'رسالة حب جديدة ❤️',
                    senderAvatar: profilesRef.current[partnerId]?.avatar
                  });
                }
              }
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'app_users' },
          () => {
            fetchSupabaseData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'chat_settings' },
          () => {
            fetchSupabaseData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'custom_stickers' },
          () => {
            fetchSupabaseData();
          }
        )
        .on('broadcast', { event: 'PARTNER_TYPING' }, ({ payload }) => {
          if (payload && payload.userId !== loggedInUserId) {
            setIsPartnerTyping(Boolean(payload.isTyping));
          }
        })
        .on('broadcast', { event: 'SYNC_PINNED' }, ({ payload }) => {
          if (payload) {
            setPinnedMsgId(payload.pinnedId || null);
            if (payload.pinnedId) {
              localStorage.setItem('romantic_chat_pinned_id', payload.pinnedId);
            } else {
              localStorage.removeItem('romantic_chat_pinned_id');
            }
          }
        })
        .on('broadcast', { event: 'SYNC_STARRED' }, ({ payload }) => {
          if (payload && Array.isArray(payload.starredIds)) {
            setStarredMsgIds(payload.starredIds);
            localStorage.setItem('romantic_chat_starred_ids', JSON.stringify(payload.starredIds));
          }
        })
        .subscribe();

      supabaseChannelRef.current = channel;

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchSupabaseData, loggedInUserId, playSound]);

  // Local BroadcastChannel fallback for cross-tab testing on same device
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('couples_chat_realtime_channel');
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'SYNC_MESSAGES') {
          if (Array.isArray(payload)) {
            setMessages((prev) => {
              const pendingUploads = prev.filter(
                (m) => m.isUploading && !payload.some((dbMsg: any) => dbMsg.id === m.id)
              );
              return [...payload, ...pendingUploads];
            });
          }
        } else if (type === 'SYNC_WALLPAPER') {
          setChatBg(payload.chatBg);
          setCustomBgUrl(payload.customBgUrl);
          if (payload.bgOverlayOpacity !== undefined) {
            setBgOverlayOpacity(payload.bgOverlayOpacity);
          }
        } else if (type === 'SYNC_STICKERS') {
          setStickers(payload);
        } else if (type === 'SYNC_MOODS') {
          setPartnerMoods(payload);
        } else if (type === 'SYNC_PROFILES') {
          setProfiles(payload);
        } else if (type === 'SYNC_PINNED') {
          setPinnedMsgId(payload?.pinnedId || null);
        } else if (type === 'SYNC_STARRED') {
          if (Array.isArray(payload?.starredIds)) setStarredMsgIds(payload.starredIds);
        } else if (type === 'PARTNER_TYPING') {
          if (payload.userId !== loggedInUserId) {
            setIsPartnerTyping(payload.isTyping);
          }
        }
      };

      return () => channel.close();
    }
  }, [loggedInUserId, playSound]);

  const broadcastUpdate = (type: string, payload: any) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type, payload });
    }
    if (['PARTNER_TYPING', 'SYNC_PINNED', 'SYNC_STARRED'].includes(type) && supabaseChannelRef.current) {
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: type,
        payload
      });
    }
  };

  // Persist States to LocalStorage
  useEffect(() => {
    localStorage.setItem('couples_chat_messages_live', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('romantic_chat_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('romantic_chat_stickers', JSON.stringify(stickers));
  }, [stickers]);

  useEffect(() => {
    localStorage.setItem('romantic_chat_bg', chatBg);
    localStorage.setItem('romantic_chat_custom_bg', customBgUrl);
    localStorage.setItem('romantic_chat_bg_opacity', String(bgOverlayOpacity));
  }, [chatBg, customBgUrl, bgOverlayOpacity]);

  useEffect(() => {
    localStorage.setItem('romantic_chat_moods', JSON.stringify(partnerMoods));
  }, [partnerMoods]);

  useEffect(() => {
    localStorage.setItem('romantic_chat_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('romantic_chat_anniversary', anniversaryDate);
  }, [anniversaryDate]);

  // Auto-scroll to bottom on new message (unless user has scrolled up to read older messages)
  useEffect(() => {
    if (!showScrollBottom) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isPartnerTyping, loggedInUserId, showScrollBottom]);

  // Mark partner messages as read when logged in user views chat
  useEffect(() => {
    if (!loggedInUserId) return;
    const unreadFromPartner = messages.filter(
      (m) => m.senderId !== loggedInUserId && m.status !== 'read'
    );
    if (unreadFromPartner.length > 0) {
      const updated = messages.map((m) =>
        m.senderId !== loggedInUserId ? { ...m, status: 'read' } : m
      );
      setMessages(updated);
      broadcastUpdate('SYNC_MESSAGES', updated);

      const supabase = getSupabaseClient();
      if (supabase && dbConnected) {
        const partnerUsername = ID_TO_USERNAME[loggedInUserId === 'user1' ? 'user2' : 'user1'];
        supabase
          .from('messages')
          .update({ is_read: true })
          .eq('sender', partnerUsername)
          .eq('is_read', false)
          .then();
      }
    }
  }, [messages, loggedInUserId, dbConnected]);

  // Voice Recording Timer
  useEffect(() => {
    let timer: any;
    if (isRecordingVoice) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecordingVoice]);

  // Initialize Canvas background when opened
  useEffect(() => {
    if (isCanvasOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = darkMode ? '#131B2E' : '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [isCanvasOpen, darkMode]);

  // Handle Login Form Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = loginUsername.trim().toLowerCase();
    const cleanPin = loginPin.trim();

    // Check against Supabase app_users first if connected
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: dbUser } = await supabase
          .from('app_users')
          .select('*')
          .eq('username', cleanUser)
          .eq('pin_code', cleanPin)
          .maybeSingle();

        if (dbUser) {
          const matchedId = USERNAME_TO_ID[dbUser.username] || 'user1';
          localStorage.setItem('couples_chat_auth_user', matchedId);
          setLoggedInUserId(matchedId);
          setLoginError('');
          setLoginUsername('');
          setLoginPin('');
          await supabase
            .from('app_users')
            .update({ is_online: true, last_seen: new Date().toISOString() })
            .eq('username', dbUser.username);
          return;
        }
      } catch {
        // Fallback to local profiles check
      }
    }

    const matchedAccount = Object.values(profiles).find(
      (acc: any) =>
        (acc.username.toLowerCase() === cleanUser ||
          acc.name.toLowerCase() === cleanUser) &&
        acc.pin === cleanPin
    );

    if (matchedAccount) {
      localStorage.setItem('couples_chat_auth_user', matchedAccount.id);
      setLoggedInUserId(matchedAccount.id);
      setLoginError('');
      setLoginUsername('');
      setLoginPin('');
    } else {
      setLoginError('اسم المستخدم أو الرمز السري غير صحيح. هذا التطبيق خاص بشخصين فقط ❤️');
    }
  };

  // Handle Explicit Logout
  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    if (supabase && loggedInUserId) {
      const myUsername = ID_TO_USERNAME[loggedInUserId];
      await supabase
        .from('app_users')
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq('username', myUsername);
    }
    localStorage.removeItem('couples_chat_auth_user');
    setLoggedInUserId(null);
    setActiveNav('chat');
  };

  // Save Supabase Credentials from UI
  const handleSaveSupabaseKeys = () => {
    localStorage.setItem('couples_supabase_url', supabaseUrlInput.trim());
    localStorage.setItem('couples_supabase_anon_key', supabaseKeyInput.trim());
    fetchSupabaseData();
  };

  // Calculate Days Together
  const getDaysTogether = () => {
    const start = new Date(anniversaryDate);
    if (isNaN(start.getTime())) return 365;
    const diff = Math.max(1, Math.ceil((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return diff;
  };

  // Compress uploaded image via Canvas
  const processImageFile = (file: File | undefined, maxWidth = 600, callback: (dataUrl: string, blob: Blob | null) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL('image/webp', 0.85);
        const blob = dataURLtoBlob(compressedDataUrl);
        callback(compressedDataUrl, blob);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Instant Optimistic Image & Video Sender (0ms UI latency)
  const handleSendMediaFile = useCallback(
    async (file: File) => {
      if (!loggedInUserId || !file) return;
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isVideo && !isImage) return;

      const supabase = getSupabaseClient();
      const myUsername = ID_TO_USERNAME[loggedInUserId];
      const msgId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      // Create instant 0ms local preview URL
      const localPreviewUrl = URL.createObjectURL(file);
      const replyIdForDb =
        replyingTo?.id && !String(replyingTo.id).startsWith('msg-') ? replyingTo.id : null;

      const optimisticMsg = {
        id: msgId,
        senderId: loggedInUserId,
        type: isVideo ? 'video' : 'sticker',
        stickerUrl: isImage ? localPreviewUrl : undefined,
        videoUrl: isVideo ? localPreviewUrl : undefined,
        isUploading: true,
        time: formatTimeFromISO(),
        timestamp: Date.now(),
        status: 'sent',
        reactions: [],
        replyTo: replyingTo
          ? {
              id: replyingTo.id,
              senderId: replyingTo.senderId,
              senderName: profiles[replyingTo.senderId]?.name,
              snippet:
                replyingTo.text ||
                (replyingTo.type === 'video'
                  ? '🎥 مقطع فيديو'
                  : replyingTo.type === 'sticker'
                  ? '🖼️ صورة / ملصق'
                  : '🎤 رسالة صوتية')
            }
          : null
      };

      setMessages((prev) => {
        const next = [...prev, optimisticMsg];
        broadcastUpdate('SYNC_MESSAGES', next);
        return next;
      });
      setReplyingTo(null);
      setPastedMedia(null);
      setShowMediaDrawer(false);
      playSound('send');

      if (isVideo) {
        // Upload video directly to Supabase Storage
        const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
        let finalVideoUrl = localPreviewUrl;
        const uploadedUrl = await uploadMediaToStorage(file, 'videos', ext);
        if (uploadedUrl) {
          finalVideoUrl = uploadedUrl;
        }

        setMessages((prev) => {
          const next = prev.map((m) =>
            m.id === msgId ? { ...m, videoUrl: finalVideoUrl, isUploading: false } : m
          );
          broadcastUpdate('SYNC_MESSAGES', next);
          return next;
        });

        if (supabase && dbConnected) {
          await supabase.from('messages').insert({
            id: msgId.startsWith('msg-') ? undefined : msgId,
            sender: myUsername,
            type: 'video',
            content: finalVideoUrl,
            reply_to_id: replyIdForDb,
            reactions: [],
            is_edited: false,
            is_read: false
          });
        }
      } else {
        // Compress image fast & upload in background
        processImageFile(file, 900, async (compressedDataUrl, blob) => {
          let finalImageUrl = compressedDataUrl;
          if (blob) {
            const uploadedUrl = await uploadMediaToStorage(blob, 'images', 'webp');
            if (uploadedUrl) {
              finalImageUrl = uploadedUrl;
            }
          }

          setMessages((prev) => {
            const next = prev.map((m) =>
              m.id === msgId ? { ...m, stickerUrl: finalImageUrl, isUploading: false } : m
            );
            broadcastUpdate('SYNC_MESSAGES', next);
            return next;
          });

          if (supabase && dbConnected) {
            await supabase.from('messages').insert({
              id: msgId.startsWith('msg-') ? undefined : msgId,
              sender: myUsername,
              type: 'sticker',
              content: finalImageUrl,
              reply_to_id: replyIdForDb,
              reactions: [],
              is_edited: false,
              is_read: false
            });
          }
        });
      }
    },
    [loggedInUserId, replyingTo, profiles, dbConnected, playSound]
  );

  // Handle Clipboard Paste (Ctrl+V / Mobile Paste for Images & Videos)
  const handleClipboardPaste = useCallback(
    (e: React.ClipboardEvent | ClipboardEvent) => {
      if (!loggedInUserId) return;
      const clipboardData = (e as React.ClipboardEvent).clipboardData || (e as ClipboardEvent).clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/') || item.type.startsWith('video/')) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              const previewUrl = URL.createObjectURL(file);
              setPastedMedia({
                file,
                previewUrl,
                isVideo: file.type.startsWith('video/')
              });
              return;
            }
          }
        }
      }

      if (clipboardData.files && clipboardData.files.length > 0) {
        const file = clipboardData.files[0];
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          e.preventDefault();
          const previewUrl = URL.createObjectURL(file);
          setPastedMedia({
            file,
            previewUrl,
            isVideo: file.type.startsWith('video/')
          });
        }
      }
    },
    [loggedInUserId]
  );

  // Global Paste listener so Ctrl+V works anywhere in the chat window
  useEffect(() => {
    if (!loggedInUserId || activeNav !== 'chat') return;
    const onGlobalPaste = (e: ClipboardEvent) => {
      handleClipboardPaste(e);
    };
    window.addEventListener('paste', onGlobalPaste);
    return () => window.removeEventListener('paste', onGlobalPaste);
  }, [loggedInUserId, activeNav, handleClipboardPaste]);

  // Send or Edit Message
  const handleSendMessage = async (content: string, type = 'text', extra: any = {}) => {
    if (!loggedInUserId) return;

    // If there is a pasted image/video in the preview bar and user clicks Send / presses Enter
    if (type === 'text' && pastedMedia) {
      const mediaToSend = pastedMedia;
      setPastedMedia(null);
      await handleSendMediaFile(mediaToSend.file);
      if (!content || !content.trim()) return;
    }

    if (type === 'text' && (!content || !content.trim())) return;

    const supabase = getSupabaseClient();
    const myUsername = ID_TO_USERNAME[loggedInUserId];

    if (editingMessage) {
      const updated = messages.map((msg) =>
        msg.id === editingMessage.id
          ? { ...msg, text: content.trim(), edited: true }
          : msg
      );
      setMessages(updated);
      broadcastUpdate('SYNC_MESSAGES', updated);

      if (supabase && dbConnected) {
        await supabase
          .from('messages')
          .update({ content: content.trim(), is_edited: true })
          .eq('id', editingMessage.id);
      }

      setEditingMessage(null);
      setInputText('');
      return;
    }

    const tempId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const newMsg = {
      id: tempId,
      senderId: loggedInUserId,
      type,
      text: type === 'text' ? content.trim() : undefined,
      ...extra,
      time: formatTimeFromISO(),
      timestamp: Date.now(),
      status: 'sent',
      reactions: [],
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderId: replyingTo.senderId,
            senderName: profiles[replyingTo.senderId]?.name,
            snippet:
              replyingTo.text ||
              (replyingTo.type === 'video'
                ? '🎥 مقطع فيديو'
                : replyingTo.type === 'sticker'
                ? '🖼️ صورة / ملصق'
                : '🎤 رسالة صوتية')
          }
        : null
    };

    const nextMessages = [...messages, newMsg];
    setMessages(nextMessages);
    broadcastUpdate('SYNC_MESSAGES', nextMessages);
    isCurrentlyTypingRef.current = false;
    broadcastUpdate('PARTNER_TYPING', { userId: loggedInUserId, isTyping: false });

    const replyIdForDb =
      replyingTo?.id && !String(replyingTo.id).startsWith('msg-') ? replyingTo.id : null;

    setInputText('');
    setReplyingTo(null);
    setShowMediaDrawer(false);
    playSound('send');

    if (supabase && dbConnected) {
      let dbContent = content.trim();
      if (type === 'sticker') {
        dbContent = extra.stickerUrl || '';
      } else if (type === 'video') {
        dbContent = extra.videoUrl || '';
      } else if (type === 'voice') {
        dbContent = JSON.stringify({
          duration: extra.voiceDuration || 3,
          url: extra.audioDataUrl || ''
        });
      }

      await supabase.from('messages').insert({
        id: tempId.startsWith('msg-') ? undefined : tempId,
        sender: myUsername,
        type,
        content: dbContent,
        reply_to_id: replyIdForDb,
        reactions: [],
        is_edited: false,
        is_read: false
      });
    }
  };

  // Handle Input Typing Indicator (Throttled & Debounced)
  const handleInputChange = (val: string) => {
    setInputText(val);
    if (!loggedInUserId) return;

    if (val.length > 0) {
      if (!isCurrentlyTypingRef.current) {
        isCurrentlyTypingRef.current = true;
        broadcastUpdate('PARTNER_TYPING', { userId: loggedInUserId, isTyping: true });
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isCurrentlyTypingRef.current = false;
        broadcastUpdate('PARTNER_TYPING', { userId: loggedInUserId, isTyping: false });
      }, 2500);
    } else {
      if (isCurrentlyTypingRef.current) {
        isCurrentlyTypingRef.current = false;
        broadcastUpdate('PARTNER_TYPING', { userId: loggedInUserId, isTyping: false });
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  // Delete Message for Both
  const handleDeleteMessage = async (id: string) => {
    const nextMessages = messages.filter((m) => m.id !== id);
    setMessages(nextMessages);
    broadcastUpdate('SYNC_MESSAGES', nextMessages);
    setActiveMessageActionId(null);

    const supabase = getSupabaseClient();
    if (supabase && dbConnected && !String(id).startsWith('msg-')) {
      await supabase.from('messages').delete().eq('id', id);
    }
  };

  // Toggle Emoji Reaction with Telegram-style Burst Effect
  const handleToggleReaction = async (msgId: string, emoji: string, clientX?: number, clientY?: number) => {
    let updatedReactions: string[] = [];
    const nextMessages = messages.map((msg) => {
      if (msg.id !== msgId) return msg;
      const exists = msg.reactions?.includes(emoji);
      updatedReactions = exists
        ? msg.reactions.filter((r: string) => r !== emoji)
        : [...(msg.reactions || []), emoji];
      return { ...msg, reactions: updatedReactions };
    });
    setMessages(nextMessages);
    broadcastUpdate('SYNC_MESSAGES', nextMessages);
    setActiveMessageActionId(null);
    playSound('receive');

    // Trigger Telegram Floating Reaction Particles
    const posX = clientX ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
    const posY = clientY ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 300);
    triggerReactionBurst(posX, posY, emoji);

    const supabase = getSupabaseClient();
    if (supabase && dbConnected && !String(msgId).startsWith('msg-')) {
      await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('id', msgId);
    }
  };

  // Real or Simulated Voice Recording
  const startVoiceRecording = async () => {
    setIsRecordingVoice(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
      }
    } catch {
      // Fallback to simulated voice note if mic permission is blocked
    }
  };

  const finishVoiceRecording = () => {
    const duration = recordingSeconds > 0 ? recordingSeconds : 3;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const publicUrl = await uploadMediaToStorage(blob, 'voice', 'webm');
        if (publicUrl) {
          handleSendMessage('', 'voice', {
            voiceDuration: duration,
            audioDataUrl: publicUrl
          });
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            handleSendMessage('', 'voice', {
              voiceDuration: duration,
              audioDataUrl: reader.result
            });
          };
          reader.readAsDataURL(blob);
        }
      };
      mediaRecorderRef.current.stop();
    } else {
      handleSendMessage('', 'voice', { voiceDuration: duration });
    }
    setIsRecordingVoice(false);
  };

  // Upload Custom Sticker (Storage Bucket + custom_stickers table)
  const handleUploadSticker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processImageFile(file, 320, async (dataUrl, blob) => {
      let finalUrl = dataUrl;
      if (blob) {
        const uploadedUrl = await uploadMediaToStorage(blob, 'stickers', 'webp');
        if (uploadedUrl) finalUrl = uploadedUrl;
      }

      const nextStickers = [finalUrl, ...stickers];
      setStickers(nextStickers);
      broadcastUpdate('SYNC_STICKERS', nextStickers);

      const supabase = getSupabaseClient();
      if (supabase && dbConnected && loggedInUserId) {
        await supabase.from('custom_stickers').insert({
          url: finalUrl,
          added_by: ID_TO_USERNAME[loggedInUserId]
        });
      }
    });
  };

  // Upload Shared Chat Wallpaper (Storage Bucket + chat_settings table)
  const handleUploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processImageFile(file, 1200, async (dataUrl, blob) => {
      let finalUrl = dataUrl;
      if (blob) {
        const uploadedUrl = await uploadMediaToStorage(blob, 'wallpapers', 'webp');
        if (uploadedUrl) finalUrl = uploadedUrl;
      }

      setCustomBgUrl(finalUrl);
      setChatBg('custom');
      broadcastUpdate('SYNC_WALLPAPER', {
        chatBg: 'custom',
        customBgUrl: finalUrl,
        bgOverlayOpacity
      });

      const supabase = getSupabaseClient();
      if (supabase && dbConnected && loggedInUserId) {
        await supabase
          .from('chat_settings')
          .update({
            wallpaper_url: finalUrl,
            updated_by: ID_TO_USERNAME[loggedInUserId],
            updated_at: new Date().toISOString()
          })
          .eq('id', 1);
      }
    });
  };

  // Update Preset Wallpaper in chat_settings
  const handleSelectPresetWallpaper = async (preset: 'hearts' | 'clean') => {
    setChatBg(preset);
    broadcastUpdate('SYNC_WALLPAPER', { chatBg: preset, customBgUrl });

    const supabase = getSupabaseClient();
    if (supabase && dbConnected && loggedInUserId) {
      await supabase
        .from('chat_settings')
        .update({
          wallpaper_url: preset,
          updated_by: ID_TO_USERNAME[loggedInUserId],
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);
    }
  };

  // Update Display Name in app_users
  const handleUpdateDisplayName = async (val: string) => {
    if (!loggedInUserId) return;
    const updated = {
      ...profiles,
      [loggedInUserId]: {
        ...profiles[loggedInUserId],
        name: val,
        partnerDisplayName: val.includes('♡') ? val : `${val} ♡`
      }
    };
    setProfiles(updated);
    broadcastUpdate('SYNC_PROFILES', updated);

    const supabase = getSupabaseClient();
    if (supabase && dbConnected) {
      await supabase
        .from('app_users')
        .update({ display_name: val })
        .eq('username', ID_TO_USERNAME[loggedInUserId]);
    }
  };

  // Update Mood Status in app_users
  const updateMyMood = async (newMood: string) => {
    if (!loggedInUserId) return;
    const nextMoods = {
      ...partnerMoods,
      [loggedInUserId]: newMood
    };
    setPartnerMoods(nextMoods);
    broadcastUpdate('SYNC_MOODS', nextMoods);
    setShowMoodDropdown(false);

    const supabase = getSupabaseClient();
    if (supabase && dbConnected) {
      await supabase
        .from('app_users')
        .update({ mood_text: newMood })
        .eq('username', ID_TO_USERNAME[loggedInUserId]);
    }
  };

  // Update Relationship Start Date in chat_settings
  const handleUpdateAnniversary = async (newDate: string) => {
    setAnniversaryDate(newDate);
    const supabase = getSupabaseClient();
    if (supabase && dbConnected && loggedInUserId) {
      await supabase
        .from('chat_settings')
        .update({
          relationship_start_date: newDate,
          updated_by: ID_TO_USERNAME[loggedInUserId],
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);
    }
  };

  // Clear All Messages (Start Fresh)
  const handleClearAllMessages = async () => {
    setMessages([]);
    broadcastUpdate('SYNC_MESSAGES', []);
    const supabase = getSupabaseClient();
    if (supabase && dbConnected) {
      await supabase.from('messages').delete().neq('sender', '');
    }
  };

  // Love Doodle Canvas Handlers
  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = darkMode ? '#131B2E' : '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const sendCanvasDoodle = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const blob = dataURLtoBlob(dataUrl);
    let finalUrl = dataUrl;
    if (blob) {
      const uploaded = await uploadMediaToStorage(blob, 'images', 'png');
      if (uploaded) finalUrl = uploaded;
    }
    handleSendMessage('', 'sticker', { stickerUrl: finalUrl });
    setIsCanvasOpen(false);
  };

  // Dynamic Chat Wallpaper Styles
  const getBackgroundStyles = () => {
    if (chatBg === 'custom' && customBgUrl) {
      return {
        backgroundImage: `url(${customBgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    if (chatBg === 'clean') {
      return darkMode
        ? { backgroundColor: '#0D1321' }
        : { backgroundColor: '#FDF8F8' };
    }
    const strokeColor = darkMode ? '#26324B' : '#F6D5D9';
    const heartSvg = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none">
        <path d="M40 56L37.6 53.8C29.1 46.1 23.5 41 23.5 34.8C23.5 29.7 27.5 25.7 32.6 25.7C35.5 25.7 38.3 27 40 29.1C41.7 27 44.5 25.7 47.4 25.7C52.5 25.7 56.5 29.7 56.5 34.8C56.5 41 50.9 46.1 42.4 53.8L40 56Z" stroke="${strokeColor}" stroke-width="1.6" stroke-opacity="0.65"/>
      </svg>`
    );
    return {
      backgroundImage: `url("data:image/svg+xml,${heartSvg}")`,
      backgroundRepeat: 'repeat',
      backgroundColor: darkMode ? '#0D1321' : '#FDF8F8'
    };
  };

  // ============================================================================
  // RENDER 1: DEDICATED PRIVATE LOGIN SCREEN
  // ============================================================================
  if (!loggedInUserId || !profiles[loggedInUserId]) {
    return (
      <div
        className={`w-full min-h-screen flex items-center justify-center p-4 font-sans transition-colors ${
          darkMode ? 'bg-[#0D1321] text-white' : 'bg-[#FDF4F5] text-slate-900'
        }`}
      >
        <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-rose-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-7 sm:p-9 relative">
          {/* Theme toggle in corner */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-rose-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#C8102E] transition"
            title="تبديل الوضع الليلي"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Brand Header */}
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

          {/* Private Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
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
              className="w-full py-3 rounded-xl bg-[#C8102E] hover:bg-[#a80d26] text-white font-semibold text-sm shadow-lg shadow-red-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>تسجيل الدخول إلى عالمنا ♡</span>
            </button>
          </form>

          {/* Subtle Helper Pill for First-Time Setup / Testing */}
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
  }

  // Active Authenticated User & Their Partner
  const activeUser = profiles[loggedInUserId];
  const partnerId = loggedInUserId === 'user1' ? 'user2' : 'user1';
  const partnerUser = profiles[partnerId];
  const lastMessage = messages[messages.length - 1];
  const unreadCount = messages.filter(
    (m) => m.senderId !== loggedInUserId && m.status !== 'read'
  ).length;

  // Filtered Emojis for Picker
  const currentCategoryObj =
    EMOJI_CATEGORIES.find((c) => c.id === activeEmojiCat) || EMOJI_CATEGORIES[0];

  // ============================================================================
  // RENDER 2: AUTHENTICATED COUPLE CHAT APPLICATION
  // ============================================================================
  return (
    <div
      className={`w-full h-screen flex flex-col overflow-hidden font-sans select-none ${
        darkMode ? 'bg-[#0B1120] text-slate-100' : 'bg-white text-slate-900'
      }`}
    >
      {/* 1. DEDICATED TOP NAVBAR */}
      <header className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-rose-100 dark:border-slate-800/90 bg-white dark:bg-[#0B1120] shrink-0 z-30">
        {/* Brand Logo & Title */}
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

        {/* Right Status Pill, Notification Action & Theme Toggle */}
        <div className="flex items-center gap-2">
          {!notificationsGranted ? (
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/70 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition cursor-pointer animate-pulse"
              title="تفعيل الإشعارات ليصلك تنبيه فوري بالرسائل الجديدة"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تفعيل الإشعارات</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTestNotification}
              className="p-1.5 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition cursor-pointer"
              title="الإشعارات مفعلة ✓ (انقر لتجربة إشعار)"
            >
              <BellRing className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50/80 dark:bg-[#131B2E] border border-rose-200/60 dark:border-slate-800 text-xs font-semibold text-[#C8102E] dark:text-rose-400">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>{getDaysTogether()} Days Together</span>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-[#131B2E] hover:text-[#C8102E] transition cursor-pointer"
            title="الوضع الليلي / النهاري"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. MIDDLE WORKSPACE: SINGLE SIDEBAR + MAIN CHAT / SETTINGS PANEL */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* SINGLE SIDEBAR */}
        {activeNav === 'chat' && (
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

              {/* COMPACT RECTANGULAR CHAT BUBBLE */}
              <div
                onClick={() => setMobileScreen('chat')}
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

              {/* Compact Partner Mood Rectangular Strip */}
              <div className="px-3 py-2 rounded-xl bg-rose-50/60 dark:bg-[#161F33] border border-rose-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="truncate">
                  <span className="text-slate-400 dark:text-slate-500 mr-1">الحالة:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {partnerMoods[partnerId]}
                  </span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-[#C8102E] shrink-0" />
              </div>
            </div>

            {/* Subtle Bottom Note inside Single Sidebar */}
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
        )}

        {/* MAIN CONVERSATION VIEW OR SETTINGS / ABOUT PANEL */}
        <main className="flex-1 flex flex-col h-full relative overflow-hidden">
          {activeNav === 'settings' || mobileScreen === 'settings' ? (
            /* SETTINGS VIEW */
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
                    onClick={() => {
                      setActiveNav('chat');
                      setMobileScreen('chat');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#C8102E] text-white text-xs font-semibold cursor-pointer"
                  >
                    العودة للشات
                  </button>
                </div>

                {/* Profile Name & Mood Customization */}
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
                        onChange={(e) => handleUpdateDisplayName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-slate-700 bg-rose-50/30 dark:bg-[#1E2738] text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1">حالتك المزاجية الحالية:</label>
                      <input
                        type="text"
                        value={partnerMoods[loggedInUserId]}
                        onChange={(e) => updateMyMood(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-slate-700 bg-rose-50/30 dark:bg-[#1E2738] text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Shared Chat Wallpaper Customization */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-rose-100 dark:border-slate-800 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-[#C8102E] dark:text-rose-400">
                    2. خلفية الشات المشتركة (تظهر لك ولها في نفس اللحظة)
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <button
                      onClick={() => handleSelectPresetWallpaper('hearts')}
                      className={`p-3 rounded-xl border font-semibold cursor-pointer ${
                        chatBg === 'hearts'
                          ? 'border-[#C8102E] bg-rose-50 dark:bg-rose-950/40 text-[#C8102E]'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      خلفية القلوب ♡
                    </button>
                    <button
                      onClick={() => handleSelectPresetWallpaper('clean')}
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
                    onChange={handleUploadBackground}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Relationship Date & Chat Reset */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-rose-100 dark:border-slate-800 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-[#C8102E] dark:text-rose-400">
                    3. تاريخ ارتباطكما وإدارة الرسائل
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="text-xs font-semibold block">تاريخ البداية لحساب الأيام:</label>
                      <span className="text-[11px] text-slate-400">
                        عدد الأيام حالياً: {getDaysTogether()} يوماً معاً ❤️
                      </span>
                    </div>
                    <input
                      type="date"
                      value={anniversaryDate}
                      onChange={(e) => handleUpdateAnniversary(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-rose-200 dark:border-slate-700 bg-rose-50/30 dark:bg-[#1E2738] text-xs"
                    />
                  </div>

                  <div className="pt-3 border-t border-rose-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold block">مسح الرسائل التجريبية والبدء من الصفر</span>
                      <span className="text-[11px] text-slate-400">
                        يحذف كل الرسائل الحالية ليبدأ الشات فارغاً تماماً بينكما
                      </span>
                    </div>
                    <button
                      onClick={handleClearAllMessages}
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
                      <span>4. إشعارات الويب وتطبيق الموبايل (Push & Local Notifications)</span>
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
                    يصلك إشعار فوري عند استلام أي رسالة جديدة من الطرف الآخر، سواء كنت تستخدم الموقع عبر اللابتوب/المتصفح أو تستخدم تطبيق الأندرويد المثبت على هاتفك.
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    {!notificationsGranted ? (
                      <button
                        type="button"
                        onClick={handleEnableNotifications}
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
                      onClick={handleTestNotification}
                      className="px-4 py-2 rounded-xl border border-rose-200 dark:border-slate-700 bg-rose-50/50 dark:bg-[#1E2738] hover:bg-rose-100 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <BellRing className="w-4 h-4 text-[#C8102E]" />
                      <span>تجربة إرسال إشعار فوري للتحقق 🔔</span>
                    </button>
                  </div>
                </div>

                {/* Supabase Database Connection Settings */}
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
                      onClick={handleSaveSupabaseKeys}
                      className="px-4 py-2 rounded-xl bg-[#C8102E] text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>حفظ وتفعيل التزامن السحابي</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeNav === 'about' || mobileScreen === 'about' ? (
            /* ABOUT VIEW */
            <div className="flex-1 flex items-center justify-center p-6 bg-[#FDF8F8] dark:bg-[#0B1120]">
              <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#131B2E] border border-rose-200/70 dark:border-slate-800 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-[#C8102E] text-white flex items-center justify-center mx-auto shadow-lg shadow-red-600/30">
                  <Heart className="w-7 h-7 fill-white" />
                </div>
                <h2 className="text-xl font-bold">ChatApp — Just You & Me ♡</h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  تطبيق محادثة خاص مصمم خصيصاً لكما فقط. يعمل بتزامن لحظي عبر الويب والأندرويد مع حفظ جلسة الدخول تلقائياً لكل طرف.
                </p>
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-[#1E2738] text-xs font-semibold text-[#C8102E] dark:text-rose-300">
                  معاً منذ {getDaysTogether()} يوماً ❤️
                </div>
                <button
                  onClick={() => {
                    setActiveNav('chat');
                    setMobileScreen('chat');
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#C8102E] text-white text-xs font-semibold cursor-pointer"
                >
                  العودة إلى الشات
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE CHAT CONVERSATION AREA */
            <>
              {/* Conversation Sub-Header */}
              <div className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-rose-100 dark:border-slate-800/80 bg-white/95 dark:bg-[#131B2E] shrink-0 z-10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileScreen('list')}
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
                      {partnerMoods[partnerId]}
                    </p>
                  </div>
                </div>

                {/* Conversation Action Icons */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {/* WhatsApp / Telegram Search Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(!isSearchOpen);
                      if (isSearchOpen) setSearchQuery('');
                    }}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      isSearchOpen
                        ? 'bg-[#C8102E] text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800'
                    }`}
                    title="بحث في الرسائل (Ctrl+F)"
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  {/* Starred Messages Button */}
                  <button
                    type="button"
                    onClick={() => setShowStarredModal(true)}
                    className="relative p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="الرسائل والذكريات المميزة بنجمة"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        starredMsgIds.length > 0 ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                    {starredMsgIds.length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400"></span>
                    )}
                  </button>

                  {/* Shared Media Gallery Button */}
                  <button
                    type="button"
                    onClick={() => setShowSharedMediaModal(true)}
                    className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="معرض الوسائط والملفات المشتركة"
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
                            onClick={() => updateMyMood(m)}
                            className="w-full text-right px-3 py-1.5 rounded-xl text-xs hover:bg-rose-50 dark:hover:bg-slate-800 transition block cursor-pointer"
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setIsCanvasOpen(true)}
                    className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="ارسموا لبعض (Love Canvas)"
                  >
                    <PenTool className="w-4 h-4 text-[#C8102E]" />
                  </button>

                  <button
                    onClick={() => setActiveCallModal('video')}
                    className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="مكالمة فيديو"
                  >
                    <Video className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setActiveCallModal('voice')}
                    className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="مكالمة صوتية"
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setActiveNav('settings');
                      setMobileScreen('settings');
                    }}
                    className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="إعدادات الخلفية والشات"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* WHATSAPP / TELEGRAM IN-CHAT SEARCH BAR */}
              {isSearchOpen && (
                <div className="px-4 py-2 bg-white/95 dark:bg-[#1E2738]/95 border-b border-rose-200/80 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs z-20 animate-in fade-in duration-150">
                  <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50/70 dark:bg-[#161F33] border border-rose-200/60 dark:border-slate-700">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentMatchIdx(0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNextSearchMatch();
                        if (e.key === 'Escape') {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }
                      }}
                      placeholder="ابحث عن أي كلمة أو ذكرى في الرسائل..."
                      className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1">
                      {searchMatches.length > 0
                        ? `${currentMatchIdx + 1} من ${searchMatches.length}`
                        : searchQuery
                        ? 'لا نتائج'
                        : ''}
                    </span>
                    <button
                      type="button"
                      onClick={handlePrevSearchMatch}
                      disabled={searchMatches.length === 0}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                      title="النتيجة السابقة"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextSearchMatch}
                      disabled={searchMatches.length === 0}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                      title="النتيجة التالية"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#C8102E] hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="إغلاق البحث"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TELEGRAM & WHATSAPP PINNED MESSAGE BAR */}
              {(() => {
                const pinnedMsg = messages.find((m) => m.id === pinnedMsgId);
                if (!pinnedMsg) return null;
                const senderName = profiles[pinnedMsg.senderId]?.name || 'رسالة مثبتة';
                const snippet = pinnedMsg.text
                  ? pinnedMsg.text
                  : pinnedMsg.type === 'video'
                  ? '🎥 مقطع فيديو'
                  : pinnedMsg.type === 'sticker'
                  ? '🖼️ صورة / ملصق'
                  : '🎤 رسالة صوتية';

                return (
                  <div className="px-4 py-2 bg-white/95 dark:bg-[#161F33]/95 border-b border-rose-200/70 dark:border-slate-800 backdrop-blur-md flex items-center justify-between gap-3 shadow-2xs z-10 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div
                      onClick={() => jumpToMessage(pinnedMsg.id)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-[#C8102E] flex items-center justify-center shrink-0 group-hover:scale-110 transition shadow-2xs">
                        <Pin className="w-3.5 h-3.5 fill-[#C8102E]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#C8102E] dark:text-rose-400">
                            رسالة مثبتة • {senderName}
                          </span>
                          <span className="text-[10px] text-slate-400">{pinnedMsg.time}</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium group-hover:text-[#C8102E] dark:group-hover:text-rose-300 transition">
                          {snippet}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePinMessage(pinnedMsg.id)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-[#C8102E] hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="إلغاء التثبيت"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })()}

              {/* Messages Canvas with Shared Wallpaper & Scroll tracking */}
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                style={getBackgroundStyles()}
                onClick={() => {
                  setActiveMessageActionId(null);
                  setShowMediaDrawer(false);
                  setShowMoodDropdown(false);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer?.files?.[0];
                  if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
                    handleSendMediaFile(file);
                  }
                }}
                className="flex-1 overflow-y-auto px-4 md:px-8 py-5 space-y-3 relative"
              >
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-[#1E2738] flex items-center justify-center text-[#C8102E] mb-3 shadow-inner">
                      <Heart className="w-7 h-7 fill-[#C8102E]" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                      الشات جاهز لكما أنتما الاثنين فقط ♡
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                      أرسل أول رسالة أو ملصق حب إلى {partnerUser.partnerDisplayName} لتظهر لديها فوراً.
                    </p>
                  </div>
                )}

                {messages.map((msg, index) => {
                  const isMe = msg.senderId === loggedInUserId;
                  const isSelected = activeMessageActionId === msg.id;
                  const isSwiping = swipingId === msg.id;
                  const currentOffset = isSwiping ? swipeOffset : 0;
                  const isHighlighted = highlightedMsgId === msg.id;
                  const isStarred = starredMsgIds.includes(msg.id);
                  const isPinned = pinnedMsgId === msg.id;
                  const isNewDay =
                    index === 0 ||
                    getMessageDateGroup(msg.timestamp) !==
                      getMessageDateGroup(messages[index - 1]?.timestamp);

                  return (
                    <React.Fragment key={msg.id}>
                      {/* WhatsApp Intelligent Date Chip Separator */}
                      {isNewDay && (
                        <div className="flex justify-center my-3 select-none">
                          <div className="px-3.5 py-1 rounded-full text-[11px] font-semibold bg-white/85 dark:bg-[#1E2738]/90 text-slate-600 dark:text-slate-300 shadow-2xs border border-rose-200/50 dark:border-slate-700/60 backdrop-blur-md">
                            {getMessageDateGroup(msg.timestamp)}
                          </div>
                        </div>
                      )}

                      <div
                        id={`msg-${msg.id}`}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveMessageActionId(isSelected ? null : msg.id);
                        }}
                        onDoubleClick={() => {
                          // Double click on empty space of message row triggers Reply
                          setReplyingTo(msg);
                        }}
                        className={`group flex flex-col relative w-full py-1 cursor-default select-none transition-all rounded-2xl ${
                          isHighlighted ? 'highlight-jump bg-[#C8102E]/10 ring-2 ring-[#C8102E]/50 p-1' : ''
                        } ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {/* Quoted Reply Box */}
                        {msg.replyTo && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (msg.replyTo.id) jumpToMessage(msg.replyTo.id);
                            }}
                            className={`text-[11px] mb-1 px-3 py-1.5 rounded-xl border-l-4 max-w-xs sm:max-w-md shadow-2xs backdrop-blur-xs transition cursor-pointer hover:opacity-90 ${
                              isMe
                                ? 'bg-rose-900/15 dark:bg-rose-950/60 text-slate-700 dark:text-slate-200 border-[#C8102E]'
                                : 'bg-white/95 dark:bg-[#1E2738]/95 text-slate-700 dark:text-slate-300 border-rose-400'
                            }`}
                          >
                            <span className="font-bold text-[#C8102E] dark:text-rose-400 block text-[10px]">
                              {msg.replyTo.senderName}
                            </span>
                            <span className="truncate block opacity-90 text-[11px]">
                              {msg.replyTo.snippet}
                            </span>
                          </div>
                        )}

                        {/* Row Content with Touch Swipe & Desktop Hover Actions */}
                        <div className="relative max-w-[85%] sm:max-w-md flex items-center gap-1.5">
                          {/* Swipe-to-Reply Visual Indicator */}
                          {isSwiping && Math.abs(currentOffset) > 12 && (
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full pointer-events-none transition-all z-20 ${
                                Math.abs(currentOffset) >= 40
                                  ? 'bg-[#C8102E] text-white scale-110 shadow-md ring-2 ring-white/70 dark:ring-slate-900/70'
                                  : 'bg-rose-100 dark:bg-slate-800 text-[#C8102E] scale-90'
                              } ${currentOffset > 0 ? '-left-11' : '-right-11'}`}
                            >
                              <CornerUpLeft
                                className={`w-4 h-4 ${currentOffset < 0 ? 'scale-x-[-1]' : ''}`}
                              />
                            </div>
                          )}

                          {/* Desktop Quick Actions on Hover (for My Messages: left side) */}
                          {isMe && (
                            <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReplyingTo(msg);
                                }}
                                className="p-1.5 rounded-full hover:bg-rose-100/70 dark:hover:bg-slate-800 text-slate-400 hover:text-[#C8102E] transition cursor-pointer"
                                title="رد على الرسالة (Double click)"
                              >
                                <CornerUpLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMessageActionId(isSelected ? null : msg.id);
                                }}
                                className="p-1.5 rounded-full hover:bg-rose-100/70 dark:hover:bg-slate-800 text-slate-400 hover:text-[#C8102E] transition cursor-pointer"
                                title="تفاعل أو خيارات (Right click)"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Message Bubble Container with Spring Transform */}
                          <div
                            style={{
                              transform: currentOffset ? `translateX(${currentOffset}px)` : undefined,
                              transition: isSwiping ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0, 0, 1)'
                            }}
                            onTouchStart={(e) => handleTouchStart(e, msg.id)}
                            onTouchMove={(e) => handleTouchMove(e, msg.id)}
                            onTouchEnd={() => handleTouchEnd(msg)}
                            className="relative max-w-full"
                          >
                            {msg.type === 'sticker' ? (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMessageActionId(isSelected ? null : msg.id);
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setActiveMessageActionId(isSelected ? null : msg.id);
                                }}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleReaction(msg.id, '❤️', e.clientX, e.clientY);
                                }}
                                className="relative inline-block cursor-pointer group"
                              >
                                <img
                                  src={msg.stickerUrl}
                                  alt="Sent media"
                                  className="max-w-[230px] sm:max-w-[280px] max-h-72 w-auto h-auto object-cover rounded-2xl drop-shadow-md border border-rose-200/50 dark:border-slate-700/60 transition-transform group-hover:scale-[1.01]"
                                />
                                {msg.isUploading && (
                                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#C8102E]/90 text-white text-[10px] font-semibold animate-pulse shadow-xs">
                                    جاري الرفع... ⚡
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxImageUrl(msg.stickerUrl);
                                  }}
                                  className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/65 text-white text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                  title="تكبير الصورة"
                                >
                                  تكبير 🔍
                                </button>
                                <span className="absolute bottom-1.5 right-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/75 text-white text-[10px] font-medium backdrop-blur-xs flex items-center gap-1">
                                  {isStarred && (
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                                  )}
                                  {isPinned && (
                                    <Pin className="w-3 h-3 fill-[#C8102E] text-[#C8102E] shrink-0" />
                                  )}
                                  <span>{msg.time}</span>
                                  {isMe && (
                                    msg.status === 'read' ? (
                                      <CheckCheck className="w-3 h-3 text-white stroke-[2.2]" />
                                    ) : (
                                      <Check className="w-3 h-3 text-white/80 stroke-[2]" />
                                    )
                                  )}
                                </span>
                              </div>
                            ) : msg.type === 'video' ? (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMessageActionId(isSelected ? null : msg.id);
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setActiveMessageActionId(isSelected ? null : msg.id);
                                }}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleReaction(msg.id, '❤️', e.clientX, e.clientY);
                                }}
                                className={`relative p-1.5 rounded-2xl shadow-md cursor-pointer ${
                                  isMe
                                    ? 'bg-[#C8102E] text-white rounded-br-xs'
                                    : 'bg-white dark:bg-[#1E2738] text-slate-900 dark:text-slate-100 rounded-bl-xs border border-rose-100/70 dark:border-slate-700/60'
                                }`}
                              >
                                <div className="relative rounded-xl overflow-hidden bg-black">
                                  <video
                                    src={msg.videoUrl}
                                    controls
                                    playsInline
                                    preload="metadata"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-64 sm:w-80 max-h-80 object-contain rounded-xl bg-black"
                                  />
                                  {msg.isUploading && (
                                    <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#C8102E]/90 text-white text-[10px] font-semibold animate-pulse shadow-xs">
                                      جاري رفع الفيديو... ⚡
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={`flex items-center justify-end gap-1 px-2 pt-1 text-[10px] ${
                                    isMe ? 'text-rose-100' : 'text-slate-400'
                                  }`}
                                >
                                  {isStarred && (
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                                  )}
                                  {isPinned && (
                                    <Pin className="w-3 h-3 fill-[#C8102E] text-[#C8102E] shrink-0" />
                                  )}
                                  <span>🎥 فيديو</span>
                                  <span>•</span>
                                  <span>{msg.time}</span>
                                  {isMe && (
                                    msg.status === 'read' ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-white stroke-[2.2]" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-white/80 stroke-[2]" />
                                    )
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMessageActionId(isSelected ? null : msg.id);
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setActiveMessageActionId(isSelected ? null : msg.id);
                                }}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleReaction(msg.id, '❤️', e.clientX, e.clientY);
                                }}
                                className={`relative px-4 py-2.5 cursor-pointer shadow-xs transition ${
                                  isMe
                                    ? 'bg-[#C8102E] text-white rounded-2xl rounded-br-xs'
                                    : 'bg-white dark:bg-[#1E2738] text-slate-900 dark:text-slate-100 rounded-2xl rounded-bl-xs border border-rose-100/70 dark:border-slate-700/60'
                                }`}
                              >
                                {msg.type === 'text' && (
                                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                    <FormattedMessageText
                                      text={msg.text}
                                      searchQuery={searchQuery}
                                    />
                                    <span
                                      className={`ml-auto flex items-center gap-1 text-[10px] shrink-0 select-none ${
                                        isMe ? 'text-rose-100/90' : 'text-slate-400'
                                      }`}
                                    >
                                      {isStarred && (
                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                                      )}
                                      {isPinned && (
                                        <Pin className="w-3 h-3 fill-rose-300 dark:fill-[#C8102E] shrink-0" />
                                      )}
                                      {msg.edited && <span className="italic">معدلة</span>}
                                      <span>{msg.time}</span>
                                      {isMe && (
                                        msg.status === 'read' ? (
                                          <CheckCheck className="w-3.5 h-3.5 text-white stroke-[2.2]" />
                                        ) : (
                                          <Check className="w-3.5 h-3.5 text-white/80 stroke-[2]" />
                                        )
                                      )}
                                    </span>
                                  </div>
                                )}

                                {msg.type === 'voice' && (
                                  <div className="flex items-center gap-2.5 min-w-[210px] sm:min-w-[230px] py-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (msg.audioDataUrl) {
                                          if (playingVoiceId === msg.id && activeAudioRef.current) {
                                            activeAudioRef.current.pause();
                                            setPlayingVoiceId(null);
                                            return;
                                          }
                                          if (activeAudioRef.current) {
                                            activeAudioRef.current.pause();
                                          }
                                          const audio = new Audio(msg.audioDataUrl);
                                          audio.playbackRate = voicePlaybackSpeed;
                                          activeAudioRef.current = audio;
                                          setPlayingVoiceId(msg.id);

                                          audio.ontimeupdate = () => {
                                            setAudioProgress((prev) => ({
                                              ...prev,
                                              [msg.id]: {
                                                current: Math.floor(audio.currentTime),
                                                total: Math.floor(audio.duration || msg.voiceDuration || 3)
                                              }
                                            }));
                                          };
                                          audio.onended = () => {
                                            setPlayingVoiceId(null);
                                            setAudioProgress((prev) => ({
                                              ...prev,
                                              [msg.id]: {
                                                current: 0,
                                                total: Math.floor(audio.duration || msg.voiceDuration || 3)
                                              }
                                            }));
                                          };
                                          audio.play().catch(() => {});
                                        } else {
                                          setPlayingVoiceId(msg.id);
                                          playSound('receive');
                                          setTimeout(() => setPlayingVoiceId(null), 2500);
                                        }
                                      }}
                                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs hover:scale-105 transition cursor-pointer ${
                                        isMe ? 'bg-white text-[#C8102E]' : 'bg-[#C8102E] text-white'
                                      }`}
                                    >
                                      {playingVoiceId === msg.id ? (
                                        <Pause className="w-4 h-4 fill-current" />
                                      ) : (
                                        <Play className="w-4 h-4 fill-current ml-0.5" />
                                      )}
                                    </button>

                                    <div className="flex-1">
                                      <div className="flex items-center gap-0.5 h-5">
                                        {[30, 65, 45, 90, 50, 75, 40, 85, 95, 55, 70, 35, 60, 40].map(
                                          (h, idx) => (
                                            <span
                                              key={idx}
                                              style={{ height: `${h}%` }}
                                              className={`w-1 rounded-full transition-all ${
                                                isMe ? 'bg-white/80' : 'bg-[#C8102E]/70'
                                              } ${playingVoiceId === msg.id ? 'animate-pulse' : ''}`}
                                            />
                                          )
                                        )}
                                      </div>
                                      <div
                                        className={`flex items-center justify-between text-[10px] mt-1 ${
                                          isMe ? 'text-rose-100' : 'text-slate-400'
                                        }`}
                                      >
                                        <span>
                                          {playingVoiceId === msg.id && audioProgress[msg.id]
                                            ? `0:0${audioProgress[msg.id].current} / 0:0${audioProgress[msg.id].total}`
                                            : `0:0${msg.voiceDuration || 3}`}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              cycleVoiceSpeed();
                                            }}
                                            className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold border transition ${
                                              isMe
                                                ? 'border-white/40 bg-white/15 text-white hover:bg-white/25'
                                                : 'border-rose-300 dark:border-slate-600 bg-rose-50 dark:bg-slate-700 text-[#C8102E] dark:text-rose-300'
                                            }`}
                                            title="تسريع الصوت (مثل واتساب وتيليجرام)"
                                          >
                                            {voicePlaybackSpeed}x
                                          </button>
                                          {isStarred && (
                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                                          )}
                                          {isPinned && (
                                            <Pin className="w-3 h-3 fill-rose-300 dark:fill-[#C8102E] shrink-0" />
                                          )}
                                          <span>{msg.time}</span>
                                          {isMe && (
                                            msg.status === 'read' ? (
                                              <CheckCheck className="w-3 h-3 text-white stroke-[2.2]" />
                                            ) : (
                                              <Check className="w-3 h-3 text-white/80 stroke-[2]" />
                                            )
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Reactions Badge */}
                            {msg.reactions && msg.reactions.length > 0 && (
                              <div
                                className={`absolute -bottom-2.5 flex items-center gap-0.5 bg-white dark:bg-[#1E2738] px-2 py-0.5 rounded-full shadow-md border border-rose-100 dark:border-slate-700 text-xs z-10 ${
                                  isMe ? 'right-2' : 'left-2'
                                }`}
                              >
                                {msg.reactions.map((r: string, i: number) => (
                                  <span key={i}>{r}</span>
                                ))}
                              </div>
                            )}

                            {/* Advanced WhatsApp & Telegram Floating Popover Menu */}
                            {isSelected && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute z-30 mt-1.5 flex flex-col items-center bg-white dark:bg-[#1E2738] rounded-2xl shadow-2xl border border-rose-100 dark:border-slate-700 p-2 min-w-[220px] ${
                                  isMe ? 'right-0' : 'left-0'
                                }`}
                              >
                                {/* Quick Reactions row */}
                                <div className="flex items-center justify-around w-full pb-2 mb-1.5 border-b border-rose-100 dark:border-slate-700">
                                  {['❤️', '😍', '😂', '🥺', '🔥', '😘'].map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={(e) =>
                                        handleToggleReaction(msg.id, emoji, e.clientX, e.clientY)
                                      }
                                      className="hover:scale-125 p-1 transition-transform text-sm cursor-pointer"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>

                                {/* Telegram & WhatsApp Actions Grid */}
                                <div className="grid grid-cols-4 gap-1 w-full text-center">
                                  {/* 1. Reply */}
                                  <button
                                    onClick={() => {
                                      setReplyingTo(msg);
                                      setActiveMessageActionId(null);
                                    }}
                                    className="flex flex-col items-center gap-1 p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                                    title="رد على الرسالة"
                                  >
                                    <CornerUpLeft className="w-3.5 h-3.5 text-[#C8102E]" />
                                    <span>رد</span>
                                  </button>

                                  {/* 2. Copy (if text) */}
                                  {msg.type === 'text' && (
                                    <button
                                      onClick={() => handleCopyMessage(msg.text)}
                                      className="flex flex-col items-center gap-1 p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                                      title="نسخ النص"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                      <span>نسخ</span>
                                    </button>
                                  )}

                                  {/* 3. Star / Unstar */}
                                  <button
                                    onClick={() => handleToggleStarMessage(msg.id)}
                                    className="flex flex-col items-center gap-1 p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                                    title="تمييز بنجمة"
                                  >
                                    <Star
                                      className={`w-3.5 h-3.5 ${
                                        isStarred
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-slate-500 dark:text-slate-400'
                                      }`}
                                    />
                                    <span>{isStarred ? 'إلغاء' : 'نجمة'}</span>
                                  </button>

                                  {/* 4. Pin / Unpin */}
                                  <button
                                    onClick={() => handleTogglePinMessage(msg.id)}
                                    className="flex flex-col items-center gap-1 p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                                    title="تثبيت بأعلى المحادثة"
                                  >
                                    <Pin
                                      className={`w-3.5 h-3.5 ${
                                        isPinned
                                          ? 'fill-[#C8102E] text-[#C8102E]'
                                          : 'text-slate-500 dark:text-slate-400'
                                      }`}
                                    />
                                    <span>{isPinned ? 'إلغاء' : 'تثبيت'}</span>
                                  </button>

                                  {/* 5. Edit (if isMe & text) */}
                                  {isMe && msg.type === 'text' && (
                                    <button
                                      onClick={() => {
                                        setEditingMessage(msg);
                                        setInputText(msg.text);
                                        setActiveMessageActionId(null);
                                      }}
                                      className="flex flex-col items-center gap-1 p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                                      title="تعديل الرسالة"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                                      <span>تعديل</span>
                                    </button>
                                  )}

                                  {/* 6. Delete */}
                                  <button
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="flex flex-col items-center gap-1 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl text-[10px] font-medium text-red-500 cursor-pointer"
                                    title="حذف الرسالة"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>حذف</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                        {/* Desktop Quick Actions on Hover (for Partner Messages: right side) */}
                        {!isMe && (
                          <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingTo(msg);
                              }}
                              className="p-1.5 rounded-full hover:bg-rose-100/70 dark:hover:bg-slate-800 text-slate-400 hover:text-[#C8102E] transition cursor-pointer"
                              title="رد على الرسالة (Double click)"
                            >
                              <CornerUpLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMessageActionId(isSelected ? null : msg.id);
                              }}
                              className="p-1.5 rounded-full hover:bg-rose-100/70 dark:hover:bg-slate-800 text-slate-400 hover:text-[#C8102E] transition cursor-pointer"
                              title="تفاعل أو خيارات (Right click)"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

                <div ref={chatBottomRef} />
              </div>

              {/* Reply / Edit Active Banner */}
              {(replyingTo || editingMessage) && (
                <div className="px-4 py-2 bg-rose-50 dark:bg-[#1A2336] border-t border-rose-200/70 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    {editingMessage ? (
                      <>
                        <Edit3 className="w-4 h-4 text-[#C8102E] shrink-0" />
                        <span className="font-semibold text-[#C8102E] dark:text-rose-400">
                          تعديل الرسالة:
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 truncate">
                          {editingMessage.text}
                        </span>
                      </>
                    ) : (
                      <>
                        <CornerUpLeft className="w-4 h-4 text-[#C8102E] shrink-0" />
                        <span className="font-semibold text-[#C8102E] dark:text-rose-400">
                          الرد على {profiles[replyingTo.senderId]?.name}:
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 truncate">
                          {replyingTo.text || 'ملف مرفق ❤️'}
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setEditingMessage(null);
                      if (editingMessage) setInputText('');
                    }}
                    className="p-1 rounded-full hover:bg-rose-200/50 dark:hover:bg-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* UNIFIED EMOJI & STICKER DRAWER WITH SWITCH BUTTON BAR */}
              {showMediaDrawer && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-18 right-3 sm:right-12 w-[calc(100vw-24px)] sm:w-96 bg-white/95 dark:bg-[#1E2738]/95 backdrop-blur-md rounded-3xl shadow-2xl border border-rose-200/80 dark:border-slate-700 overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Top Switch Button Bar */}
                  <div className="flex items-center justify-between p-2.5 border-b border-rose-100 dark:border-slate-700/80 bg-rose-50/70 dark:bg-[#151D2C]">
                    <div className="flex items-center p-1 rounded-2xl bg-rose-200/50 dark:bg-slate-800/90 gap-1 w-56 sm:w-64">
                      <button
                        type="button"
                        onClick={() => setMediaDrawerTab('emojis')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          mediaDrawerTab === 'emojis'
                            ? 'bg-white dark:bg-[#1E2738] text-[#C8102E] dark:text-rose-400 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>😀</span>
                        <span>الإيموجي</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMediaDrawerTab('stickers')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          mediaDrawerTab === 'stickers'
                            ? 'bg-white dark:bg-[#1E2738] text-[#C8102E] dark:text-rose-400 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>💖</span>
                        <span>الملصقات</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-slate-700 text-[#C8102E] dark:text-rose-300 font-bold">
                          {stickers.length}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {mediaDrawerTab === 'stickers' && (
                        <button
                          type="button"
                          onClick={() => stickerFileInputRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-xl bg-[#C8102E] hover:bg-[#a80d26] text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">إضافة ستيكر</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowMediaDrawer(false)}
                        className="p-1.5 rounded-full text-slate-400 hover:text-[#C8102E] hover:bg-rose-100/50 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tab 1: Emoji Picker */}
                  {mediaDrawerTab === 'emojis' ? (
                    <div>
                      {/* Emoji Category Tabs */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-rose-100/70 dark:border-slate-800 bg-rose-50/30 dark:bg-[#1A2234]">
                        <div className="flex items-center gap-1">
                          {EMOJI_CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => setActiveEmojiCat(cat.id)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition cursor-pointer ${
                                activeEmojiCat === cat.id
                                  ? 'bg-[#C8102E] text-white shadow-xs scale-105'
                                  : 'hover:bg-rose-100 dark:hover:bg-slate-700'
                              }`}
                              title={cat.label}
                            >
                              {cat.icon}
                            </button>
                          ))}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {currentCategoryObj.label}
                        </span>
                      </div>

                      {/* Emoji Grid */}
                      <div className="p-3 max-h-60 overflow-y-auto grid grid-cols-7 gap-1.5 text-2xl">
                        {currentCategoryObj.emojis.map((emoji, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleInputChange(inputText + emoji)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-rose-50 dark:hover:bg-slate-700/60 hover:scale-120 transition-transform cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Tab 2: Stickers Drawer */
                    <div className="p-3">
                      <input
                        type="file"
                        ref={stickerFileInputRef}
                        onChange={handleUploadSticker}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="grid grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
                        {stickers.map((stk, index) => (
                          <div
                            key={index}
                            onClick={() => handleSendMessage('', 'sticker', { stickerUrl: stk })}
                            className="aspect-square rounded-2xl overflow-hidden border border-rose-100 dark:border-slate-700 bg-rose-50/40 dark:bg-slate-800/60 p-1 cursor-pointer hover:scale-105 hover:border-[#C8102E] transition shadow-xs"
                          >
                            <img
                              src={stk}
                              alt="Custom Sticker"
                              className="w-full h-full object-cover rounded-xl"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pasted Image / Video Instant Preview Banner (Ctrl+V) */}
              {pastedMedia && (
                <div className="px-4 py-2.5 bg-rose-50/95 dark:bg-[#161F33] border-t border-rose-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {pastedMedia.isVideo ? (
                      <video
                        src={pastedMedia.previewUrl}
                        className="w-14 h-14 rounded-xl object-cover border border-[#C8102E]/40 bg-black shrink-0"
                        muted
                      />
                    ) : (
                      <img
                        src={pastedMedia.previewUrl}
                        alt="Pasted preview"
                        className="w-14 h-14 rounded-xl object-cover border border-[#C8102E]/40 shrink-0 shadow-xs"
                      />
                    )}
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#C8102E] dark:text-rose-400 block">
                        {pastedMedia.isVideo ? '🎥 فيديو جاهز للإرسال' : '🖼️ صورة من الحافظة (Paste) جاهزة للإرسال'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-300 truncate block">
                        اضغط Enter أو زر الإرسال لإرسالها بسرعة فائقة ⚡
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSendMediaFile(pastedMedia.file)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#C8102E] hover:bg-[#a80d26] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5 fill-white" />
                      <span>إرسال الآن</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPastedMedia(null)}
                      className="p-1.5 rounded-full text-slate-500 hover:bg-rose-200/50 dark:hover:bg-slate-700 cursor-pointer"
                      title="إلغاء"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Message Composer Bar */}
              <div className="px-3 sm:px-6 py-2.5 bg-[#FDF8F8] dark:bg-[#0B1120] border-t border-rose-100 dark:border-slate-800/80 shrink-0">
                <div className="flex items-center gap-2.5">
                  {isRecordingVoice ? (
                    <div className="flex-1 flex items-center justify-between px-4 py-2 rounded-full bg-red-50 dark:bg-rose-950/50 border border-[#C8102E]/40 text-[#C8102E] dark:text-rose-300">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#C8102E] animate-ping"></span>
                        <span className="text-xs font-bold">
                          جاري تسجيل رسالة صوتية... 0:0{recordingSeconds}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                              mediaRecorderRef.current.stop();
                            }
                            setIsRecordingVoice(false);
                          }}
                          className="text-xs text-slate-500 hover:text-red-600 font-semibold px-2 cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={finishVoiceRecording}
                          className="px-3 py-1 rounded-full bg-[#C8102E] text-white text-xs font-semibold cursor-pointer"
                        >
                          إرسال
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#131B2E] border border-rose-200/80 dark:border-slate-700/80 shadow-xs focus-within:border-[#C8102E] focus-within:ring-2 focus-within:ring-[#C8102E]/15 transition">
                      <button
                        type="button"
                        onClick={() => {
                          if (showMediaDrawer && mediaDrawerTab === 'stickers') {
                            setShowMediaDrawer(false);
                          } else {
                            setMediaDrawerTab('stickers');
                            setShowMediaDrawer(true);
                          }
                        }}
                        className={`text-slate-500 dark:text-slate-400 hover:text-[#C8102E] transition cursor-pointer ${
                          showMediaDrawer && mediaDrawerTab === 'stickers' ? 'text-[#C8102E]' : ''
                        }`}
                        title="الملصقات والإيموجي"
                      >
                        <Sparkles className="w-5 h-5" />
                      </button>

                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onPaste={handleClipboardPaste}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendMessage(inputText, 'text');
                        }}
                        placeholder="اكتب رسالة أو الصق صورة (Ctrl+V)..."
                        className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={startVoiceRecording}
                        className="text-slate-500 dark:text-slate-400 hover:text-[#C8102E] transition cursor-pointer"
                        title="تسجيل رسالة صوتية"
                      >
                        <Mic className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-slate-500 dark:text-slate-400 hover:text-[#C8102E] transition cursor-pointer"
                        title="إرفاق صورة أو فيديو"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleSendMediaFile(file);
                          }
                          e.target.value = '';
                        }}
                        accept="image/*,video/*"
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          if (showMediaDrawer && mediaDrawerTab === 'emojis') {
                            setShowMediaDrawer(false);
                          } else {
                            setMediaDrawerTab('emojis');
                            setShowMediaDrawer(true);
                          }
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center hover:scale-105 transition cursor-pointer shrink-0 ${
                          showMediaDrawer && mediaDrawerTab === 'emojis'
                            ? 'bg-[#a80d26] text-white shadow-md'
                            : 'bg-[#C8102E] text-white'
                        }`}
                        title="الإيموجي والملصقات"
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSendMessage(inputText, 'text')}
                    className="w-10 h-10 rounded-full bg-[#C8102E] hover:bg-[#a80d26] text-white flex items-center justify-center shadow-md shadow-red-600/25 hover:scale-105 active:scale-95 transition cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4 fill-white -ml-0.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* 3. FULL-WIDTH BOTTOM NAVIGATION BAR */}
      <footer className="h-13 px-4 md:px-6 bg-white dark:bg-[#0B1120] border-t border-rose-100 dark:border-slate-800/90 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => {
              setActiveNav('chat');
              setMobileScreen('chat');
            }}
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
                  activeNav === 'chat'
                    ? 'bg-white/25 text-white'
                    : 'bg-[#C8102E] text-white'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveNav('settings');
              setMobileScreen('settings');
            }}
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
            onClick={() => {
              setActiveNav('about');
              setMobileScreen('about');
            }}
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
              {activeUser.name}
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-400">
              (Online)
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-[#131B2E] hover:text-[#C8102E] transition cursor-pointer"
            title="تسجيل الخروج من الحساب"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </footer>

      {/* MODAL 1: LOVE DOODLE CANVAS */}
      {isCanvasOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#131B2E] rounded-3xl p-5 shadow-2xl border border-rose-200 dark:border-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-[#C8102E]" />
                <h3 className="font-bold text-sm">ارسم رسالة حب بيدك ♡</h3>
              </div>
              <button
                onClick={() => setIsCanvasOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-[#C8102E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 border-2 border-dashed border-rose-200 dark:border-slate-700 rounded-2xl overflow-hidden flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={350}
                height={250}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="cursor-crosshair touch-none"
              />
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                {['#C8102E', '#EC4899', '#8B5CF6', '#0EA5E9', '#10B981', '#F59E0B'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setPenColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                      penColor === c ? 'scale-125 ring-2 ring-offset-2 ring-[#C8102E]' : ''
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={clearCanvas}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 font-medium cursor-pointer"
                >
                  مسح
                </button>
                <button
                  onClick={sendCanvasDoodle}
                  className="px-4 py-1.5 rounded-xl bg-[#C8102E] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  <span>إرسال الرسمة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AUDIO / VIDEO CALL OVERLAY */}
      {activeCallModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xs rounded-3xl bg-[#131B2E] border border-slate-800 p-8 text-center text-white space-y-5 shadow-2xl">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[#C8102E]/40 animate-ping"></span>
              <div className="relative w-20 h-20 rounded-full bg-[#C8102E] flex items-center justify-center ring-4 ring-rose-500/30">
                <Heart className="w-9 h-9 fill-white text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg">{partnerUser.partnerDisplayName}</h3>
              <p className="text-xs text-rose-300 mt-1">
                {activeCallModal === 'video' ? 'جاري الاتصال فيديو ❤️...' : 'جاري الاتصال صوتياً ❤️...'}
              </p>
            </div>
            <button
              onClick={() => setActiveCallModal(null)}
              className="w-14 h-14 rounded-full bg-[#C8102E] hover:bg-red-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-red-600/40 cursor-pointer"
            >
              <Phone className="w-6 h-6 rotate-135" />
            </button>
          </div>
        </div>
      )}
      {/* MODAL 3: IMAGE LIGHTBOX ZOOM */}
      {lightboxImageUrl && (
        <div
          onClick={() => setLightboxImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <button
            onClick={() => setLightboxImageUrl(null)}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImageUrl}
            alt="Full view"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* MODAL 4: STARRED ROMANTIC MESSAGES DRAWER */}
      {showStarredModal && (
        <div
          onClick={() => setShowStarredModal(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85vh] bg-white dark:bg-[#131B2E] rounded-3xl p-5 shadow-2xl border border-rose-200 dark:border-slate-700 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shadow-xs">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    الرسائل المميزة بنجمة ♡
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    أحلى الكلمات والذكريات المحفوظة بينكما ({starredMsgIds.length})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStarredModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-[#C8102E] hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {starredMsgIds.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Star className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 stroke-1" />
                  <p className="text-xs">لم تقم بتمييز أي رسالة بنجمة بعد.</p>
                  <p className="text-[11px]">
                    اضغط كليك يمين أو مطولاً على أي رسالة رومانسية واختر "تمييز بنجمة ⭐" لحفظها هنا!
                  </p>
                </div>
              ) : (
                messages
                  .filter((m) => starredMsgIds.includes(m.id))
                  .map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-[#1A2234] border border-rose-100 dark:border-slate-700/80 hover:border-[#C8102E]/40 transition flex items-start justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-[#C8102E] dark:text-rose-400">
                            {profiles[m.senderId]?.name || 'شريكي'}
                          </span>
                          <span className="text-[10px] text-slate-400">{m.time}</span>
                        </div>
                        {m.type === 'text' && (
                          <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-3 leading-relaxed">
                            {m.text}
                          </p>
                        )}
                        {m.type === 'sticker' && (
                          <img
                            src={m.stickerUrl}
                            alt="Starred media"
                            className="w-20 h-20 object-cover rounded-xl mt-1 shadow-2xs"
                          />
                        )}
                        {m.type === 'video' && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-1">
                            <Film className="w-4 h-4 text-[#C8102E]" />
                            <span>مقطع فيديو محفوظ</span>
                          </div>
                        )}
                        {m.type === 'voice' && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-1">
                            <Mic className="w-4 h-4 text-[#C8102E]" />
                            <span>تسجيل صوتي ({m.voiceDuration || 3} ثواني)</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setShowStarredModal(false);
                            jumpToMessage(m.id);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#C8102E] hover:text-white text-slate-600 dark:text-slate-300 text-[11px] font-semibold border border-rose-200/60 dark:border-slate-700 transition cursor-pointer"
                        >
                          انتقال
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStarMessage(m.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-rose-100/50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="إزالة من المميزة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SHARED MEDIA & MEMORIES GALLERY */}
      {showSharedMediaModal && (
        <div
          onClick={() => setShowSharedMediaModal(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#131B2E] rounded-3xl p-5 shadow-2xl border border-rose-200 dark:border-slate-700 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-[#C8102E] flex items-center justify-center">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    معرض الوسائط المشتركة ♡
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    كل الصور والفيديوهات والرسائل الصوتية المتبادلة بينكما
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSharedMediaModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-[#C8102E] hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 pt-3 pb-2 border-b border-rose-100/70 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setSharedMediaTab('media')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  sharedMediaTab === 'media'
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-slate-800'
                }`}
              >
                الصور والفيديوهات ({messages.filter((m) => m.type === 'video' || m.type === 'sticker').length})
              </button>
              <button
                type="button"
                onClick={() => setSharedMediaTab('voice')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  sharedMediaTab === 'voice'
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-slate-800'
                }`}
              >
                التسجيلات الصوتية ({messages.filter((m) => m.type === 'voice').length})
              </button>
              <button
                type="button"
                onClick={() => setSharedMediaTab('stickers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  sharedMediaTab === 'stickers'
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-slate-800'
                }`}
              >
                الملصقات المشتركة ({stickers.length})
              </button>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto py-3">
              {sharedMediaTab === 'media' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {messages
                    .filter((m) => m.type === 'sticker' || m.type === 'video')
                    .map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (m.stickerUrl) setLightboxImageUrl(m.stickerUrl);
                          else if (m.id) {
                            setShowSharedMediaModal(false);
                            jumpToMessage(m.id);
                          }
                        }}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-black/10 dark:bg-slate-800 border border-rose-100 dark:border-slate-700 cursor-pointer shadow-xs hover:scale-102 transition"
                      >
                        {m.type === 'video' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 text-white">
                            <Film className="w-8 h-8 text-[#C8102E]" />
                            <span className="text-[10px] mt-1 font-semibold">فيديو</span>
                          </div>
                        ) : (
                          <img
                            src={m.stickerUrl}
                            alt="Shared"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded-md bg-black/60 text-white text-[9px] backdrop-blur-xs">
                          {m.time}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {sharedMediaTab === 'voice' && (
                <div className="space-y-2">
                  {messages
                    .filter((m) => m.type === 'voice')
                    .map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-2xl bg-rose-50/50 dark:bg-[#1A2234] border border-rose-100 dark:border-slate-700 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#C8102E] text-white flex items-center justify-center">
                            <Volume2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-white block">
                              رسالة صوتية من {profiles[m.senderId]?.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {m.time} • المدة: {m.voiceDuration || 3} ثواني
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowSharedMediaModal(false);
                            jumpToMessage(m.id);
                          }}
                          className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-[#C8102E] dark:text-rose-400 border border-rose-200/60 dark:border-slate-700 hover:bg-[#C8102E] hover:text-white transition cursor-pointer"
                        >
                          استماع في الشات
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {sharedMediaTab === 'stickers' && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                  {stickers.map((stk, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setShowSharedMediaModal(false);
                        handleSendMessage('', 'sticker', { stickerUrl: stk });
                      }}
                      className="aspect-square rounded-2xl overflow-hidden border border-rose-100 dark:border-slate-700 p-1 bg-white dark:bg-slate-800 hover:scale-105 hover:border-[#C8102E] transition cursor-pointer shadow-2xs"
                    >
                      <img src={stk} alt="Sticker" className="w-full h-full object-cover rounded-xl" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SMART SCROLL-TO-BOTTOM FLOATING BUTTON (WhatsApp / Telegram style) */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => {
            chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            setNewUnseenCount(0);
          }}
          className="fixed bottom-20 right-4 sm:right-8 z-30 w-11 h-11 rounded-full bg-white dark:bg-[#1E2738] text-[#C8102E] dark:text-rose-400 shadow-xl border border-rose-200/80 dark:border-slate-700 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer group"
          title="الانتقال إلى أحدث رسالة"
        >
          <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
          {newUnseenCount > 0 && (
            <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 min-w-[20px] h-[20px] rounded-full bg-[#C8102E] text-white text-[11px] font-bold flex items-center justify-center shadow-md animate-bounce">
              {newUnseenCount}
            </span>
          )}
        </button>
      )}

      {/* TELEGRAM ANIMATED HEART REACTION PARTICLES */}
      {floatingParticles.map((p) => (
        <span
          key={p.id}
          className="heart-particle text-xl sm:text-2xl select-none"
          style={
            {
              left: `${p.x}px`,
              top: `${p.y}px`,
              '--tx': `${p.tx}px`,
              '--rot': `${p.rot}deg`
            } as any
          }
        >
          {p.char}
        </span>
      ))}

      {/* SWEET TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-[#C8102E]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

