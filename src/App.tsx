import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Heart, ChevronDown, Sparkles } from 'lucide-react';
import { getSupabaseClient, uploadMediaToStorage } from './lib/supabase';
import {
  initNotificationChannel,
  requestNotificationPermission,
  checkNotificationPermission,
  sendIncomingMessageNotification
} from './lib/notifications';
import { playChatSound } from './lib/sound';
import {
  COUPLE_ACCOUNTS,
  USERNAME_TO_ID,
  ID_TO_USERNAME,
  INITIAL_STICKERS,
  formatTimeFromISO,
  dataURLtoBlob,
  getMessageDateGroup,
  calculateDaysTogether
} from './constants/chatData';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { TopNavbar, ChatSidebar, ChatSubHeader, BottomNav } from './components/LayoutBars';
import { MessageItem } from './components/MessageItem';
import { ChatComposer } from './components/ChatComposer';
import { ChatModals } from './components/ChatModals';

export default function App() {
  // 1. AUTHENTICATION STATE
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(() => {
    return localStorage.getItem('couples_chat_auth_user') || null;
  });

  // 2. SUPABASE CONNECTION STATE
  const [dbConnected, setDbConnected] = useState(false);
  const [dbStatusMsg, setDbStatusMsg] = useState('');
  const [partnerOnline, setPartnerOnline] = useState(true);

  // 3. THEME & PAGE NAVIGATION STATE
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('romantic_chat_theme') === 'dark';
  });
  const [activeNav, setActiveNav] = useState<'chat' | 'settings' | 'about'>('chat');
  const [mobileScreen, setMobileScreen] = useState<'list' | 'chat' | 'settings' | 'about'>('chat');

  // 4. PROFILES, MOODS & ANNIVERSARY
  const [profiles, setProfiles] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('romantic_chat_profiles');
      return saved ? JSON.parse(saved) : COUPLE_ACCOUNTS;
    } catch {
      return COUPLE_ACCOUNTS;
    }
  });

  const [partnerMoods, setPartnerMoods] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('romantic_chat_moods');
      return saved
        ? JSON.parse(saved)
        : { user1: 'في الشغل 💻', user2: 'مشتاقة لك ❤️' };
    } catch {
      return { user1: 'في الشغل 💻', user2: 'مشتاقة لك ❤️' };
    }
  });

  const [anniversaryDate, setAnniversaryDate] = useState(() => {
    return localStorage.getItem('romantic_chat_anniversary') || '2024-01-01';
  });

  // 5. WALLPAPER & STICKERS
  const [chatBg, setChatBg] = useState(() => {
    return localStorage.getItem('romantic_chat_bg') || 'hearts';
  });
  const [customBgUrl, setCustomBgUrl] = useState(() => {
    return localStorage.getItem('romantic_chat_custom_bg') || '';
  });
  const [stickers, setStickers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('romantic_chat_stickers');
      return saved ? JSON.parse(saved) : INITIAL_STICKERS;
    } catch {
      return INITIAL_STICKERS;
    }
  });

  // 6. MESSAGES STATE
  const [messages, setMessages] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('couples_chat_messages_live');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 7. INTERACTIVE CHAT STATES
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [activeMessageActionId, setActiveMessageActionId] = useState<string | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  // Modals
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [activeCallModal, setActiveCallModal] = useState<string | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [showStarredModal, setShowStarredModal] = useState(false);
  const [showSharedMediaModal, setShowSharedMediaModal] = useState(false);

  // Pin, Star, Search & Scroll
  const [pinnedMsgId, setPinnedMsgId] = useState<string | null>(() => {
    return localStorage.getItem('romantic_chat_pinned_id') || null;
  });
  const [starredMsgIds, setStarredMsgIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('romantic_chat_starred_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [newUnseenCount, setNewUnseenCount] = useState(0);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  // Voice Player
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voicePlaybackSpeed, setVoicePlaybackSpeed] = useState<number>(1);
  const [audioProgress, setAudioProgress] = useState<
    Record<string, { current: number; total: number }>
  >({});
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Particles & Toast
  const [floatingParticles, setFloatingParticles] = useState<
    Array<{ id: number; x: number; y: number; tx: number; rot: number; char: string }>
  >([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  // Refs for Zero-Lag & Deduplication
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const supabaseChannelRef = useRef<any>(null);
  const toastTimeoutRef = useRef<any>(null);
  const profilesRef = useRef(profiles);
  const messagesRef = useRef(messages);
  const notifiedMsgIdsRef = useRef<Set<string>>(new Set());
  const markedReadIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  useEffect(() => {
    messagesRef.current = messages;
    messages.forEach((m) => {
      if (m.id) notifiedMsgIdsRef.current.add(m.id);
    });
  }, [messages]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  }, []);

  const jumpToMessage = useCallback((msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(msgId);
      setTimeout(() => {
        setHighlightedMsgId(null);
      }, 2000);
    }
  }, []);

  // Notifications Init
  useEffect(() => {
    initNotificationChannel();
    checkNotificationPermission().then(setNotificationsGranted);
  }, []);

  const handleEnableNotifications = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotificationsGranted(granted);
    if (granted) {
      showToast('تم تفعيل الإشعارات بنجاح 🔔❤️');
      sendIncomingMessageNotification({
        title: 'ChatApp ♡',
        body: 'تم تفعيل الإشعارات بنجاح! ستصلك رسائل حبيبك فوراً ❤️'
      });
    } else {
      showToast('يرجى السماح بالإشعارات من إعدادات المتصفح أو الهاتف');
    }
  }, [showToast]);

  const handleTestNotification = useCallback(async () => {
    const granted = await checkNotificationPermission();
    if (!granted) {
      await handleEnableNotifications();
    } else {
      const partnerId = loggedInUserId === 'user1' ? 'user2' : 'user1';
      const partnerName = profilesRef.current[partnerId]?.name || 'My Love ♡';
      sendIncomingMessageNotification({
        title: `${partnerName} ♡`,
        body: 'إشعار تجريبي: بحبك ومستني رسالتك دلوقتي ❤️'
      });
      showToast('تم إرسال إشعار تجريبي لجهازك الآن 🔔✨');
    }
  }, [handleEnableNotifications, loggedInUserId, showToast]);

  // Convert DB message row to UI message object
  const mapDbMessageToUi = useCallback(
    (row: any, allMsgsOrUi: any[], currentProfiles: Record<string, any>) => {
      const senderId = USERNAME_TO_ID[row.sender] || (row.sender === 'love' ? 'user2' : 'user1');
      let replyToObj = null;
      if (row.reply_to_id) {
        const parent = allMsgsOrUi.find((r) => r.id === row.reply_to_id);
        if (parent) {
          const parentSenderId =
            parent.senderId || USERNAME_TO_ID[parent.sender] || 'user1';
          const rawType = parent.type || 'text';
          const rawText = parent.text ?? parent.content;
          replyToObj = {
            id: parent.id,
            senderId: parentSenderId,
            senderName: currentProfiles[parentSenderId]?.name || 'شريكي',
            snippet:
              rawType === 'text'
                ? rawText
                : rawType === 'video'
                ? '🎥 مقطع فيديو'
                : rawType === 'sticker' || rawType === 'image'
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
        } catch {}
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
    },
    []
  );

  // Initial Data Load from Supabase (Runs ONCE on mount or manual key save)
  const fetchSupabaseData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setDbConnected(false);
      return;
    }

    try {
      const [usersRes, settingsRes, stickersRes, msgsRes] = await Promise.all([
        supabase.from('app_users').select('*'),
        supabase.from('chat_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('custom_stickers').select('*').order('created_at', { ascending: false }),
        supabase.from('messages').select('*').order('created_at', { ascending: true })
      ]);

      if (usersRes.error) {
        setDbConnected(false);
        setDbStatusMsg(`خطأ في الاتصال: ${usersRes.error.message}`);
        return;
      }

      setDbConnected(true);
      setDbStatusMsg('متصل بقاعدة بيانات Supabase بنجاح ✓');

      const updatedProfiles = { ...COUPLE_ACCOUNTS };
      const updatedMoods: Record<string, string> = {
        user1: 'في الشغل 💻',
        user2: 'مشتاقة لك ❤️'
      };

      if (usersRes.data && usersRes.data.length > 0) {
        usersRes.data.forEach((u: any) => {
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
            if (u.mood_text) updatedMoods[uid] = u.mood_text;
            if (loggedInUserId && uid !== loggedInUserId) {
              setPartnerOnline(Boolean(u.is_online));
            }
          }
        });
        setProfiles(updatedProfiles);
        setPartnerMoods(updatedMoods);
      }

      if (settingsRes.data) {
        if (settingsRes.data.relationship_start_date) {
          setAnniversaryDate(settingsRes.data.relationship_start_date);
        }
        const wp = settingsRes.data.wallpaper_url || '';
        if (wp === '' || wp === 'hearts') setChatBg('hearts');
        else if (wp === 'clean') setChatBg('clean');
        else {
          setChatBg('custom');
          setCustomBgUrl(wp);
        }
      }

      if (stickersRes.data && stickersRes.data.length > 0) {
        const dbStickerUrls = stickersRes.data.map((s: any) => s.url);
        setStickers([...dbStickerUrls, ...INITIAL_STICKERS]);
      }

      if (msgsRes.data) {
        msgsRes.data.forEach((r: any) => {
          if (r.id) {
            notifiedMsgIdsRef.current.add(r.id);
            if (r.is_read) markedReadIdsRef.current.add(r.id);
          }
        });
        const mapped = msgsRes.data.map((r: any) =>
          mapDbMessageToUi(r, msgsRes.data, updatedProfiles)
        );
        setMessages(mapped);
      }
    } catch {
      setDbConnected(false);
    }
  }, [loggedInUserId, mapDbMessageToUi]);

  // Incremental Zero-Latency Supabase Realtime Subscription
  useEffect(() => {
    fetchSupabaseData();

    const supabase = getSupabaseClient();
    if (!supabase) return;

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
          const eventType = payload?.eventType;
          const newRow = payload?.new;
          const oldRow = payload?.old;

          if (eventType === 'INSERT' && newRow) {
            const uiMsg = mapDbMessageToUi(
              newRow,
              messagesRef.current,
              profilesRef.current
            );
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === uiMsg.id);
              if (exists) {
                return prev.map((m) => (m.id === uiMsg.id ? uiMsg : m));
              }
              return [...prev, uiMsg];
            });

            const myUsername = loggedInUserId ? ID_TO_USERNAME[loggedInUserId] : '';
            if (newRow.sender && newRow.sender !== myUsername) {
              if (!notifiedMsgIdsRef.current.has(newRow.id)) {
                notifiedMsgIdsRef.current.add(newRow.id);
                playChatSound('receive');

                const partnerId = loggedInUserId === 'user1' ? 'user2' : 'user1';
                const partnerName = profilesRef.current[partnerId]?.name || 'My Love ♡';
                let snippet = newRow.content;
                if (newRow.type === 'video') snippet = '🎥 أرسل مقطع فيديو جديد';
                else if (newRow.type === 'sticker' || newRow.type === 'image')
                  snippet = '🖼️ أرسل صورة / ملصق حب جديد';
                else if (newRow.type === 'voice') snippet = '🎤 أرسل رسالة صوتية جديدة';

                sendIncomingMessageNotification({
                  id: newRow.id,
                  title: `${partnerName} ♡`,
                  body: snippet || 'رسالة حب جديدة ❤️',
                  senderAvatar: profilesRef.current[partnerId]?.avatar
                });
              }
            }
          } else if (eventType === 'UPDATE' && newRow) {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== newRow.id) return m;
                return {
                  ...m,
                  text: m.type === 'text' ? newRow.content : m.text,
                  edited: Boolean(newRow.is_edited),
                  status: newRow.is_read ? 'read' : m.status,
                  reactions: Array.isArray(newRow.reactions) ? newRow.reactions : m.reactions
                };
              })
            );
          } else if (eventType === 'DELETE') {
            if (oldRow?.id) {
              setMessages((prev) => prev.filter((m) => m.id !== oldRow.id));
            } else {
              fetchSupabaseData();
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_users' },
        (payload: any) => {
          const u = payload?.new;
          if (!u || !u.username) return;
          const uid = USERNAME_TO_ID[u.username];
          if (!uid) return;

          setProfiles((prev) => ({
            ...prev,
            [uid]: {
              ...prev[uid],
              username: u.username,
              pin: u.pin_code || '1234',
              name: u.display_name || prev[uid]?.name,
              partnerDisplayName: u.display_name?.includes('♡')
                ? u.display_name
                : `${u.display_name} ♡`
            }
          }));
          if (u.mood_text) {
            setPartnerMoods((prev) => ({ ...prev, [uid]: u.mood_text }));
          }
          if (loggedInUserId && uid !== loggedInUserId) {
            setPartnerOnline(Boolean(u.is_online));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_settings' },
        (payload: any) => {
          const s = payload?.new;
          if (!s) return;
          if (s.relationship_start_date) setAnniversaryDate(s.relationship_start_date);
          const wp = s.wallpaper_url || '';
          if (wp === '' || wp === 'hearts') setChatBg('hearts');
          else if (wp === 'clean') setChatBg('clean');
          else {
            setChatBg('custom');
            setCustomBgUrl(wp);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'custom_stickers' },
        (payload: any) => {
          const stk = payload?.new;
          if (stk?.url) {
            setStickers((prev) => (prev.includes(stk.url) ? prev : [stk.url, ...prev]));
          }
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
  }, [fetchSupabaseData, loggedInUserId, mapDbMessageToUi]);

  // Local BroadcastChannel for instant same-browser sync
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('couples_chat_realtime_channel');
    broadcastChannelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'SYNC_MESSAGES' && Array.isArray(payload)) {
        setMessages((prev) => {
          const pendingUploads = prev.filter(
            (m) => m.isUploading && !payload.some((dbMsg: any) => dbMsg.id === m.id)
          );
          return [...payload, ...pendingUploads];
        });
      } else if (type === 'SYNC_WALLPAPER' && payload) {
        setChatBg(payload.chatBg);
        setCustomBgUrl(payload.customBgUrl);
      } else if (type === 'SYNC_STICKERS' && Array.isArray(payload)) {
        setStickers(payload);
      } else if (type === 'SYNC_MOODS' && payload) {
        setPartnerMoods(payload);
      } else if (type === 'SYNC_PROFILES' && payload) {
        setProfiles(payload);
      } else if (type === 'SYNC_PINNED') {
        setPinnedMsgId(payload?.pinnedId || null);
      } else if (type === 'SYNC_STARRED' && Array.isArray(payload?.starredIds)) {
        setStarredMsgIds(payload.starredIds);
      } else if (type === 'PARTNER_TYPING' && payload) {
        if (payload.userId !== loggedInUserId) {
          setIsPartnerTyping(Boolean(payload.isTyping));
        }
      }
    };

    return () => channel.close();
  }, [loggedInUserId]);

  const broadcastUpdate = useCallback((type: string, payload: any) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type, payload });
    }
    if (
      ['PARTNER_TYPING', 'SYNC_PINNED', 'SYNC_STARRED'].includes(type) &&
      supabaseChannelRef.current
    ) {
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: type,
        payload
      });
    }
  }, []);

  // Debounced LocalStorage Persistence (Prevents Main-Thread Blocking)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const lightweightSlice = messages.slice(-60);
        localStorage.setItem('couples_chat_messages_live', JSON.stringify(lightweightSlice));
      } catch {}
    }, 800);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('romantic_chat_theme', darkMode ? 'dark' : 'light');
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('romantic_chat_stickers', JSON.stringify(stickers));
  }, [stickers]);

  useEffect(() => {
    localStorage.setItem('romantic_chat_bg', chatBg);
    localStorage.setItem('romantic_chat_custom_bg', customBgUrl);
  }, [chatBg, customBgUrl]);

  useEffect(() => {
    localStorage.setItem('romantic_chat_moods', JSON.stringify(partnerMoods));
  }, [partnerMoods]);

  useEffect(() => {
    localStorage.setItem('romantic_chat_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('romantic_chat_anniversary', anniversaryDate);
  }, [anniversaryDate]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!showScrollBottom) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isPartnerTyping, loggedInUserId, showScrollBottom]);

  // Deduplicated Mark-As-Read (Zero Infinite Loop)
  useEffect(() => {
    if (!loggedInUserId || activeNav !== 'chat') return;
    const unreadFromPartner = messages.filter(
      (m) =>
        m.senderId !== loggedInUserId &&
        m.status !== 'read' &&
        !markedReadIdsRef.current.has(m.id)
    );

    if (unreadFromPartner.length === 0) return;

    unreadFromPartner.forEach((m) => markedReadIdsRef.current.add(m.id));

    setMessages((prev) =>
      prev.map((m) => (m.senderId !== loggedInUserId ? { ...m, status: 'read' } : m))
    );

    const supabase = getSupabaseClient();
    if (supabase && dbConnected) {
      const validIds = unreadFromPartner
        .map((m) => m.id)
        .filter((id) => id && !String(id).startsWith('msg-'));
      if (validIds.length > 0) {
        supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', validIds)
          .then();
      }
    }
  }, [messages, loggedInUserId, dbConnected, activeNav]);

  // Search Matches Memo
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return messages
      .filter((m) => m.type === 'text' && m.text && m.text.toLowerCase().includes(q))
      .map((m) => m.id);
  }, [messages, searchQuery]);

  useEffect(() => {
    if (searchMatches.length > 0) {
      const targetId = searchMatches[currentMatchIdx] || searchMatches[0];
      if (targetId) jumpToMessage(targetId);
    }
  }, [searchMatches, currentMatchIdx, jumpToMessage]);

  const handleNextSearchMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    setCurrentMatchIdx((prev) => (prev + 1) % searchMatches.length);
  }, [searchMatches.length]);

  const handlePrevSearchMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    setCurrentMatchIdx((prev) => (prev - 1 + searchMatches.length) % searchMatches.length);
  }, [searchMatches.length]);

  const handleMessagesScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    const isScrolledUp = distanceToBottom > 160;
    setShowScrollBottom(isScrolledUp);
    if (!isScrolledUp) setNewUnseenCount(0);
  }, []);

  // Auth Handlers
  const handleLogin = useCallback(
    async (usernameInput: string, pinInput: string): Promise<string | null> => {
      const cleanUser = usernameInput.trim().toLowerCase();
      const cleanPin = pinInput.trim();

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
            await supabase
              .from('app_users')
              .update({ is_online: true, last_seen: new Date().toISOString() })
              .eq('username', dbUser.username);
            return null;
          }
        } catch {}
      }

      const matchedAccount = Object.values(profilesRef.current).find(
        (acc: any) =>
          (acc.username.toLowerCase() === cleanUser ||
            acc.name.toLowerCase() === cleanUser) &&
          acc.pin === cleanPin
      );

      if (matchedAccount) {
        localStorage.setItem('couples_chat_auth_user', matchedAccount.id);
        setLoggedInUserId(matchedAccount.id);
        return null;
      }

      return 'اسم المستخدم أو الرمز السري غير صحيح. هذا التطبيق خاص بشخصين فقط ❤️';
    },
    []
  );

  const handleLogout = useCallback(async () => {
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
  }, [loggedInUserId]);

  // Image Compression Helper
  const processImageFile = useCallback(
    (
      file: File | undefined,
      maxWidth = 600,
      callback: (dataUrl: string, blob: Blob | null) => void
    ) => {
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
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.82);
          const blob = dataURLtoBlob(compressedDataUrl);
          callback(compressedDataUrl, blob);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Send Media File (Image / Video)
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

      notifiedMsgIdsRef.current.add(msgId);
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
              senderName: profilesRef.current[replyingTo.senderId]?.name,
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
      playChatSound('send');

      if (isVideo) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
        let finalVideoUrl = localPreviewUrl;
        const uploadedUrl = await uploadMediaToStorage(file, 'videos', ext);
        if (uploadedUrl) finalVideoUrl = uploadedUrl;

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
        processImageFile(file, 850, async (compressedDataUrl, blob) => {
          let finalImageUrl = compressedDataUrl;
          if (blob) {
            const uploadedUrl = await uploadMediaToStorage(blob, 'images', 'webp');
            if (uploadedUrl) finalImageUrl = uploadedUrl;
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
    [loggedInUserId, replyingTo, dbConnected, broadcastUpdate, processImageFile]
  );

  // Send or Edit Message
  const handleSendMessage = useCallback(
    async (content: string, type = 'text', extra: any = {}) => {
      if (!loggedInUserId) return;
      if (type === 'text' && (!content || !content.trim())) return;

      const supabase = getSupabaseClient();
      const myUsername = ID_TO_USERNAME[loggedInUserId];

      if (editingMessage) {
        const trimmed = content.trim();
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === editingMessage.id ? { ...msg, text: trimmed, edited: true } : msg
          );
          broadcastUpdate('SYNC_MESSAGES', updated);
          return updated;
        });
        setEditingMessage(null);

        if (supabase && dbConnected) {
          await supabase
            .from('messages')
            .update({ content: trimmed, is_edited: true })
            .eq('id', editingMessage.id);
        }
        return;
      }

      const tempId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      notifiedMsgIdsRef.current.add(tempId);

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
              senderName: profilesRef.current[replyingTo.senderId]?.name,
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

      const replyIdForDb =
        replyingTo?.id && !String(replyingTo.id).startsWith('msg-') ? replyingTo.id : null;

      setMessages((prev) => {
        const next = [...prev, newMsg];
        broadcastUpdate('SYNC_MESSAGES', next);
        return next;
      });
      setReplyingTo(null);
      playChatSound('send');

      if (supabase && dbConnected) {
        let dbContent = content.trim();
        if (type === 'sticker') dbContent = extra.stickerUrl || '';
        else if (type === 'video') dbContent = extra.videoUrl || '';
        else if (type === 'voice') {
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
    },
    [loggedInUserId, editingMessage, replyingTo, dbConnected, broadcastUpdate]
  );

  const handleTypingChange = useCallback(
    (isTyping: boolean) => {
      if (!loggedInUserId) return;
      broadcastUpdate('PARTNER_TYPING', { userId: loggedInUserId, isTyping });
    },
    [loggedInUserId, broadcastUpdate]
  );

  const handleDeleteMessage = useCallback(
    async (id: string) => {
      setMessages((prev) => {
        const next = prev.filter((m) => m.id !== id);
        broadcastUpdate('SYNC_MESSAGES', next);
        return next;
      });
      setActiveMessageActionId(null);

      const supabase = getSupabaseClient();
      if (supabase && dbConnected && !String(id).startsWith('msg-')) {
        await supabase.from('messages').delete().eq('id', id);
      }
    },
    [dbConnected, broadcastUpdate]
  );

  const handleToggleReaction = useCallback(
    async (msgId: string, emoji: string, clientX?: number, clientY?: number) => {
      let updatedReactions: string[] = [];
      setMessages((prev) => {
        const next = prev.map((msg) => {
          if (msg.id !== msgId) return msg;
          const hasEmoji = msg.reactions?.includes(emoji);
          const nextReactions = hasEmoji
            ? msg.reactions.filter((r: string) => r !== emoji)
            : [...(msg.reactions || []), emoji];
          updatedReactions = nextReactions;
          return { ...msg, reactions: nextReactions };
        });
        broadcastUpdate('SYNC_MESSAGES', next);
        return next;
      });
      setActiveMessageActionId(null);

      if (clientX && clientY) {
        const burst = Array.from({ length: 6 }).map((_, i) => ({
          id: Date.now() + i + Math.random(),
          x: clientX,
          y: clientY,
          tx: (Math.random() - 0.5) * 90,
          rot: (Math.random() - 0.5) * 60,
          char: emoji
        }));
        setFloatingParticles((prev) => [...prev, ...burst]);
        setTimeout(() => {
          setFloatingParticles((prev) => prev.filter((p) => !burst.some((b) => b.id === p.id)));
        }, 900);
      }

      const supabase = getSupabaseClient();
      if (supabase && dbConnected && !String(msgId).startsWith('msg-')) {
        await supabase.from('messages').update({ reactions: updatedReactions }).eq('id', msgId);
      }
    },
    [dbConnected, broadcastUpdate]
  );

  const handleTogglePinMessage = useCallback(
    (msgId: string) => {
      setPinnedMsgId((prev) => {
        const next = prev === msgId ? null : msgId;
        if (next) {
          localStorage.setItem('romantic_chat_pinned_id', next);
          showToast('تم تثبيت الرسالة في أعلى المحادثة 📌');
        } else {
          localStorage.removeItem('romantic_chat_pinned_id');
          showToast('تم إلغاء تثبيت الرسالة');
        }
        broadcastUpdate('SYNC_PINNED', { pinnedId: next });
        return next;
      });
      setActiveMessageActionId(null);
    },
    [broadcastUpdate, showToast]
  );

  const handleToggleStarMessage = useCallback(
    (msgId: string) => {
      setStarredMsgIds((prev) => {
        const exists = prev.includes(msgId);
        const next = exists ? prev.filter((id) => id !== msgId) : [...prev, msgId];
        localStorage.setItem('romantic_chat_starred_ids', JSON.stringify(next));
        broadcastUpdate('SYNC_STARRED', { starredIds: next });
        showToast(exists ? 'تمت إزالة النجمة ⭐' : 'تم حفظ الرسالة في ذكرياتكما المميزة ⭐');
        return next;
      });
      setActiveMessageActionId(null);
    },
    [broadcastUpdate, showToast]
  );

  const handleCopyMessage = useCallback(
    (text?: string) => {
      if (!text) return;
      try {
        navigator.clipboard.writeText(text);
        showToast('تم نسخ نص الرسالة 📋');
      } catch {
        showToast('تعذر النسخ تلقائياً');
      }
      setActiveMessageActionId(null);
    },
    [showToast]
  );

  // Voice Playback Handlers
  const handlePlayVoice = useCallback(
    (msg: any) => {
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
        };
        audio.play().catch(() => {});
      } else {
        setPlayingVoiceId(msg.id);
        playChatSound('receive');
        setTimeout(() => setPlayingVoiceId(null), 2500);
      }
    },
    [playingVoiceId, voicePlaybackSpeed]
  );

  const cycleVoiceSpeed = useCallback(() => {
    const speeds = [1, 1.5, 2];
    setVoicePlaybackSpeed((prev) => {
      const next = speeds[(speeds.indexOf(prev) + 1) % speeds.length];
      if (activeAudioRef.current) {
        activeAudioRef.current.playbackRate = next;
      }
      showToast(`سرعة الصوت: ${next}x ⚡`);
      return next;
    });
  }, [showToast]);

  // Settings Handlers
  const handleUploadSticker = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      processImageFile(file, 320, async (dataUrl, blob) => {
        let finalUrl = dataUrl;
        if (blob) {
          const uploadedUrl = await uploadMediaToStorage(blob, 'stickers', 'webp');
          if (uploadedUrl) finalUrl = uploadedUrl;
        }
        setStickers((prev) => {
          const next = [finalUrl, ...prev];
          broadcastUpdate('SYNC_STICKERS', next);
          return next;
        });

        const supabase = getSupabaseClient();
        if (supabase && dbConnected && loggedInUserId) {
          await supabase.from('custom_stickers').insert({
            url: finalUrl,
            added_by: ID_TO_USERNAME[loggedInUserId]
          });
        }
      });
    },
    [processImageFile, broadcastUpdate, dbConnected, loggedInUserId]
  );

  const handleUploadBackground = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      processImageFile(file, 1100, async (dataUrl, blob) => {
        let finalUrl = dataUrl;
        if (blob) {
          const uploadedUrl = await uploadMediaToStorage(blob, 'wallpapers', 'webp');
          if (uploadedUrl) finalUrl = uploadedUrl;
        }
        setCustomBgUrl(finalUrl);
        setChatBg('custom');
        broadcastUpdate('SYNC_WALLPAPER', { chatBg: 'custom', customBgUrl: finalUrl });

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
    },
    [processImageFile, broadcastUpdate, dbConnected, loggedInUserId]
  );

  const handleSelectPresetWallpaper = useCallback(
    async (preset: 'hearts' | 'clean') => {
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
    },
    [broadcastUpdate, customBgUrl, dbConnected, loggedInUserId]
  );

  const handleUpdateDisplayName = useCallback(
    async (val: string) => {
      if (!loggedInUserId) return;
      setProfiles((prev) => {
        const updated = {
          ...prev,
          [loggedInUserId]: {
            ...prev[loggedInUserId],
            name: val,
            partnerDisplayName: val.includes('♡') ? val : `${val} ♡`
          }
        };
        broadcastUpdate('SYNC_PROFILES', updated);
        return updated;
      });

      const supabase = getSupabaseClient();
      if (supabase && dbConnected) {
        await supabase
          .from('app_users')
          .update({ display_name: val })
          .eq('username', ID_TO_USERNAME[loggedInUserId]);
      }
    },
    [loggedInUserId, broadcastUpdate, dbConnected]
  );

  const updateMyMood = useCallback(
    async (newMood: string) => {
      if (!loggedInUserId) return;
      setPartnerMoods((prev) => {
        const next = { ...prev, [loggedInUserId]: newMood };
        broadcastUpdate('SYNC_MOODS', next);
        return next;
      });

      const supabase = getSupabaseClient();
      if (supabase && dbConnected) {
        await supabase
          .from('app_users')
          .update({ mood_text: newMood })
          .eq('username', ID_TO_USERNAME[loggedInUserId]);
      }
    },
    [loggedInUserId, broadcastUpdate, dbConnected]
  );

  const handleUpdateAnniversary = useCallback(
    async (newDate: string) => {
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
    },
    [dbConnected, loggedInUserId]
  );

  const handleClearAllMessages = useCallback(async () => {
    setMessages([]);
    broadcastUpdate('SYNC_MESSAGES', []);
    const supabase = getSupabaseClient();
    if (supabase && dbConnected) {
      await supabase.from('messages').delete().neq('sender', '');
    }
  }, [broadcastUpdate, dbConnected]);

  const handleSaveSupabaseKeys = useCallback(
    (url: string, key: string) => {
      localStorage.setItem('couples_supabase_url', url);
      localStorage.setItem('couples_supabase_anon_key', key);
      fetchSupabaseData();
      showToast('تم حفظ إعدادات السحابة وإعادة الاتصال ✓');
    },
    [fetchSupabaseData, showToast]
  );

  // Memoized Background Styles
  const backgroundStyles = useMemo(() => {
    if (chatBg === 'custom' && customBgUrl) {
      return {
        backgroundImage: `url(${customBgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    if (chatBg === 'clean') {
      return darkMode ? { backgroundColor: '#0D1321' } : { backgroundColor: '#FDF8F8' };
    }
    const strokeColor = darkMode ? '#26324B' : '#F6D5D9';
    const heartSvg = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><path d="M40 56L37.6 53.8C29.1 46.1 23.5 41 23.5 34.8C23.5 29.7 27.5 25.7 32.6 25.7C35.5 25.7 38.3 27 40 29.1C41.7 27 44.5 25.7 47.4 25.7C52.5 25.7 56.5 29.7 56.5 34.8C56.5 41 50.9 46.1 42.4 53.8L40 56Z" stroke="${strokeColor}" stroke-width="1.6" stroke-opacity="0.65"/></svg>`
    );
    return {
      backgroundImage: `url("data:image/svg+xml,${heartSvg}")`,
      backgroundRepeat: 'repeat',
      backgroundColor: darkMode ? '#0D1321' : '#FDF8F8'
    };
  }, [chatBg, customBgUrl, darkMode]);

  const daysTogether = useMemo(() => calculateDaysTogether(anniversaryDate), [anniversaryDate]);

  // ============================================================================
  // RENDER 1: LOGIN PAGE
  // ============================================================================
  if (!loggedInUserId || !profiles[loggedInUserId]) {
    return (
      <LoginPage
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogin={handleLogin}
      />
    );
  }

  const activeUser = profiles[loggedInUserId];
  const partnerId = loggedInUserId === 'user1' ? 'user2' : 'user1';
  const partnerUser = profiles[partnerId];
  const lastMessage = messages[messages.length - 1];
  const unreadCount = messages.filter(
    (m) => m.senderId !== loggedInUserId && m.status !== 'read'
  ).length;
  const pinnedMessage = pinnedMsgId ? messages.find((m) => m.id === pinnedMsgId) : null;

  // ============================================================================
  // RENDER 2: MAIN APPLICATION
  // ============================================================================
  return (
    <div
      className={`w-full h-screen flex flex-col overflow-hidden font-sans select-none ${
        darkMode ? 'bg-[#0B1120] text-slate-100' : 'bg-white text-slate-900'
      }`}
    >
      {/* Top Navbar */}
      <TopNavbar
        daysTogether={daysTogether}
        darkMode={darkMode}
        notificationsGranted={notificationsGranted}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onEnableNotifications={handleEnableNotifications}
        onTestNotification={handleTestNotification}
      />

      {/* Middle Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeNav === 'chat' && (
          <ChatSidebar
            mobileScreen={mobileScreen}
            partnerUser={partnerUser}
            partnerOnline={partnerOnline}
            partnerMood={partnerMoods[partnerId]}
            lastMessage={lastMessage}
            isPartnerTyping={isPartnerTyping}
            unreadCount={unreadCount}
            dbConnected={dbConnected}
            onSelectChat={() => setMobileScreen('chat')}
          />
        )}

        <main className="flex-1 flex flex-col h-full relative overflow-hidden">
          {activeNav === 'settings' || mobileScreen === 'settings' ? (
            <SettingsPage
              activeUser={activeUser}
              myMood={partnerMoods[loggedInUserId]}
              chatBg={chatBg}
              anniversaryDate={anniversaryDate}
              daysTogether={daysTogether}
              notificationsGranted={notificationsGranted}
              dbConnected={dbConnected}
              dbStatusMsg={dbStatusMsg}
              onBackToChat={() => {
                setActiveNav('chat');
                setMobileScreen('chat');
              }}
              onUpdateDisplayName={handleUpdateDisplayName}
              onUpdateMood={updateMyMood}
              onSelectPresetWallpaper={handleSelectPresetWallpaper}
              onUploadBackground={handleUploadBackground}
              onUpdateAnniversary={handleUpdateAnniversary}
              onClearAllMessages={handleClearAllMessages}
              onEnableNotifications={handleEnableNotifications}
              onTestNotification={handleTestNotification}
              onSaveSupabaseKeys={handleSaveSupabaseKeys}
            />
          ) : activeNav === 'about' || mobileScreen === 'about' ? (
            <AboutPage
              daysTogether={daysTogether}
              onBackToChat={() => {
                setActiveNav('chat');
                setMobileScreen('chat');
              }}
            />
          ) : (
            <>
              {/* Chat Header, Search & Pinned Bar */}
              <ChatSubHeader
                partnerUser={partnerUser}
                partnerOnline={partnerOnline}
                isPartnerTyping={isPartnerTyping}
                partnerMood={partnerMoods[partnerId]}
                starredCount={starredMsgIds.length}
                isSearchOpen={isSearchOpen}
                searchQuery={searchQuery}
                searchMatchesCount={searchMatches.length}
                currentMatchIdx={currentMatchIdx}
                pinnedMessage={pinnedMessage}
                pinnedSenderName={
                  pinnedMessage ? profiles[pinnedMessage.senderId]?.name || 'رسالة مثبتة' : ''
                }
                onShowMobileList={() => setMobileScreen('list')}
                onToggleSearch={() => {
                  setIsSearchOpen((prev) => {
                    if (prev) setSearchQuery('');
                    return !prev;
                  });
                }}
                onSearchQueryChange={(q) => {
                  setSearchQuery(q);
                  setCurrentMatchIdx(0);
                }}
                onNextSearchMatch={handleNextSearchMatch}
                onPrevSearchMatch={handlePrevSearchMatch}
                onOpenStarred={() => setShowStarredModal(true)}
                onOpenSharedMedia={() => setShowSharedMediaModal(true)}
                onUpdateMood={updateMyMood}
                onOpenCanvas={() => setIsCanvasOpen(true)}
                onOpenCall={(type) => setActiveCallModal(type)}
                onOpenSettings={() => {
                  setActiveNav('settings');
                  setMobileScreen('settings');
                }}
                onJumpToMessage={jumpToMessage}
                onUnpinMessage={handleTogglePinMessage}
              />

              {/* Messages List */}
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                style={backgroundStyles}
                onClick={() => setActiveMessageActionId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer?.files?.[0];
                  if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
                    handleSendMediaFile(file);
                  }
                }}
                className="flex-1 overflow-y-auto px-4 md:px-8 py-5 space-y-3 relative"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-[#1E2738] flex items-center justify-center text-[#C8102E] mb-3">
                      <Heart className="w-7 h-7 fill-[#C8102E]" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                      الشات جاهز لكما أنتما الاثنين فقط ♡
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                      أرسل أول رسالة أو ملصق حب إلى {partnerUser.partnerDisplayName} لتظهر لديها فوراً.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const currentGroup = getMessageDateGroup(msg.timestamp);
                    const prevGroup =
                      index > 0 ? getMessageDateGroup(messages[index - 1]?.timestamp) : null;
                    const dateGroupLabel = index === 0 || currentGroup !== prevGroup ? currentGroup : null;

                    return (
                      <MessageItem
                        key={msg.id}
                        msg={msg}
                        isMe={msg.senderId === loggedInUserId}
                        isSelected={activeMessageActionId === msg.id}
                        isHighlighted={highlightedMsgId === msg.id}
                        isStarred={starredMsgIds.includes(msg.id)}
                        isPinned={pinnedMsgId === msg.id}
                        dateGroupLabel={dateGroupLabel}
                        searchQuery={searchQuery}
                        playingVoiceId={playingVoiceId}
                        voicePlaybackSpeed={voicePlaybackSpeed}
                        voiceCurrentTime={audioProgress[msg.id]?.current}
                        voiceTotalTime={audioProgress[msg.id]?.total}
                        onSelectMessage={setActiveMessageActionId}
                        onReply={setReplyingTo}
                        onEdit={setEditingMessage}
                        onDelete={handleDeleteMessage}
                        onCopy={handleCopyMessage}
                        onToggleReaction={handleToggleReaction}
                        onToggleStar={handleToggleStarMessage}
                        onTogglePin={handleTogglePinMessage}
                        onJumpToMessage={jumpToMessage}
                        onOpenLightbox={setLightboxImageUrl}
                        onPlayVoice={handlePlayVoice}
                        onCycleVoiceSpeed={cycleVoiceSpeed}
                      />
                    );
                  })
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Isolated Message Composer (Typing here NEVER re-renders messages!) */}
              <ChatComposer
                loggedInUserId={loggedInUserId}
                replyingTo={replyingTo}
                replySenderName={replyingTo ? profiles[replyingTo.senderId]?.name : undefined}
                editingMessage={editingMessage}
                stickers={stickers}
                onCancelReplyOrEdit={() => {
                  setReplyingTo(null);
                  setEditingMessage(null);
                }}
                onSendMessage={handleSendMessage}
                onSendMediaFile={handleSendMediaFile}
                onUploadSticker={handleUploadSticker}
                onTypingChange={handleTypingChange}
              />
            </>
          )}
        </main>
      </div>

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeNav={activeNav}
        unreadCount={unreadCount}
        activeUserName={activeUser.name}
        onNavigate={(page) => {
          setActiveNav(page);
          setMobileScreen(page);
        }}
        onLogout={handleLogout}
      />

      {/* Lazy / Conditional Modals */}
      <ChatModals
        darkMode={darkMode}
        isCanvasOpen={isCanvasOpen}
        activeCallModal={activeCallModal}
        lightboxImageUrl={lightboxImageUrl}
        showStarredModal={showStarredModal}
        showSharedMediaModal={showSharedMediaModal}
        partnerDisplayName={partnerUser.partnerDisplayName}
        messages={messages}
        starredMsgIds={starredMsgIds}
        stickers={stickers}
        profiles={profiles}
        onCloseCanvas={() => setIsCanvasOpen(false)}
        onCloseCallModal={() => setActiveCallModal(null)}
        onCloseLightbox={() => setLightboxImageUrl(null)}
        onCloseStarredModal={() => setShowStarredModal(false)}
        onCloseSharedMediaModal={() => setShowSharedMediaModal(false)}
        onOpenLightbox={setLightboxImageUrl}
        onJumpToMessage={jumpToMessage}
        onToggleStarMessage={handleToggleStarMessage}
        onSendMessage={handleSendMessage}
      />

      {/* Smart Scroll-to-Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => {
            chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            setNewUnseenCount(0);
          }}
          className="fixed bottom-20 right-4 sm:right-8 z-30 w-11 h-11 rounded-full bg-white dark:bg-[#1E2738] text-[#C8102E] dark:text-rose-400 shadow-xl border border-rose-200/80 dark:border-slate-700 flex items-center justify-center cursor-pointer"
          title="الانتقال إلى أحدث رسالة"
        >
          <ChevronDown className="w-5 h-5" />
          {newUnseenCount > 0 && (
            <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 min-w-[20px] h-[20px] rounded-full bg-[#C8102E] text-white text-[11px] font-bold flex items-center justify-center shadow-md">
              {newUnseenCount}
            </span>
          )}
        </button>
      )}

      {/* Reaction Burst Particles */}
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-semibold shadow-xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C8102E]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
