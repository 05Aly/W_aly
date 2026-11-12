import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Smile, Paperclip, Mic, Sparkles, Plus, X, Edit3, CornerUpLeft
} from 'lucide-react';
import { EMOJI_CATEGORIES } from '../constants/chatData';
import { uploadMediaToStorage } from '../lib/supabase';

interface ChatComposerProps {
  loggedInUserId: string;
  replyingTo: any;
  replySenderName?: string;
  editingMessage: any;
  stickers: string[];
  onCancelReplyOrEdit: () => void;
  onSendMessage: (content: string, type?: string, extra?: any) => void;
  onSendMediaFile: (file: File) => Promise<void>;
  onUploadSticker: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTypingChange: (isTyping: boolean) => void;
}

export const ChatComposer = React.memo(function ChatComposer({
  loggedInUserId,
  replyingTo,
  replySenderName,
  editingMessage,
  stickers,
  onCancelReplyOrEdit,
  onSendMessage,
  onSendMediaFile,
  onUploadSticker,
  onTypingChange
}: ChatComposerProps) {
  const [inputText, setInputText] = useState('');
  const [showMediaDrawer, setShowMediaDrawer] = useState(false);
  const [mediaDrawerTab, setMediaDrawerTab] = useState<'emojis' | 'stickers'>('emojis');
  const [activeEmojiCat, setActiveEmojiCat] = useState('people');
  const [pastedMedia, setPastedMedia] = useState<{
    file: File;
    previewUrl: string;
    isVideo: boolean;
  } | null>(null);

  // Voice Note Recorder State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stickerFileInputRef = useRef<HTMLInputElement | null>(null);
  const isCurrentlyTypingRef = useRef(false);
  const typingTimeoutRef = useRef<any>(null);

  // Sync input text when editing a message
  useEffect(() => {
    if (editingMessage) {
      setInputText(editingMessage.text || '');
    }
  }, [editingMessage]);

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

  const handleInputChange = (val: string) => {
    setInputText(val);
    if (val.length > 0) {
      if (!isCurrentlyTypingRef.current) {
        isCurrentlyTypingRef.current = true;
        onTypingChange(true);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isCurrentlyTypingRef.current = false;
        onTypingChange(false);
      }, 2500);
    } else {
      if (isCurrentlyTypingRef.current) {
        isCurrentlyTypingRef.current = false;
        onTypingChange(false);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  // Clipboard Paste (Ctrl+V)
  const handleClipboardPaste = useCallback(
    (e: React.ClipboardEvent | ClipboardEvent) => {
      if (!loggedInUserId) return;
      const clipboardData =
        (e as React.ClipboardEvent).clipboardData || (e as ClipboardEvent).clipboardData;
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

  useEffect(() => {
    const onGlobalPaste = (e: ClipboardEvent) => handleClipboardPaste(e);
    window.addEventListener('paste', onGlobalPaste);
    return () => window.removeEventListener('paste', onGlobalPaste);
  }, [handleClipboardPaste]);

  const triggerSend = async () => {
    if (pastedMedia) {
      const mediaToSend = pastedMedia;
      setPastedMedia(null);
      await onSendMediaFile(mediaToSend.file);
      if (!inputText.trim()) return;
    }
    if (!inputText.trim()) return;

    const textToSend = inputText;
    setInputText('');
    setShowMediaDrawer(false);
    if (isCurrentlyTypingRef.current) {
      isCurrentlyTypingRef.current = false;
      onTypingChange(false);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    onSendMessage(textToSend, 'text');
  };

  const startVoiceRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
      }
    } catch {
      // Fallback simulation if mic blocked
    }
    setIsRecordingVoice(true);
  };

  const finishVoiceRecording = () => {
    const duration = Math.max(1, recordingSeconds);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const publicUrl = await uploadMediaToStorage(blob, 'voice', 'webm');
        if (publicUrl) {
          onSendMessage('', 'voice', {
            voiceDuration: duration,
            audioDataUrl: publicUrl
          });
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            onSendMessage('', 'voice', {
              voiceDuration: duration,
              audioDataUrl: reader.result
            });
          };
          reader.readAsDataURL(blob);
        }
      };
      mediaRecorderRef.current.stop();
    } else {
      onSendMessage('', 'voice', { voiceDuration: duration });
    }
    setIsRecordingVoice(false);
  };

  const currentCategoryObj =
    EMOJI_CATEGORIES.find((c) => c.id === activeEmojiCat) || EMOJI_CATEGORIES[0];

  return (
    <div className="relative shrink-0">
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
                  الرد على {replySenderName}:
                </span>
                <span className="text-slate-600 dark:text-slate-300 truncate">
                  {replyingTo.text || 'ملف مرفق ❤️'}
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => {
              if (editingMessage) setInputText('');
              onCancelReplyOrEdit();
            }}
            className="p-1 rounded-full hover:bg-rose-200/50 dark:hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* UNIFIED EMOJI & STICKER DRAWER */}
      {showMediaDrawer && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-16 right-3 sm:right-12 w-[calc(100vw-24px)] sm:w-96 bg-white dark:bg-[#1E2738] rounded-3xl shadow-2xl border border-rose-200/80 dark:border-slate-700 overflow-hidden z-40"
        >
          <div className="flex items-center justify-between p-2.5 border-b border-rose-100 dark:border-slate-700/80 bg-rose-50/70 dark:bg-[#151D2C]">
            <div className="flex items-center p-1 rounded-2xl bg-rose-200/50 dark:bg-slate-800/90 gap-1 w-56 sm:w-64">
              <button
                type="button"
                onClick={() => setMediaDrawerTab('emojis')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mediaDrawerTab === 'emojis'
                    ? 'bg-white dark:bg-[#1E2738] text-[#C8102E] dark:text-rose-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
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
                    : 'text-slate-600 dark:text-slate-400'
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

          {mediaDrawerTab === 'emojis' ? (
            <div>
              <div className="flex items-center justify-between px-3 py-2 border-b border-rose-100/70 dark:border-slate-800 bg-rose-50/30 dark:bg-[#1A2234]">
                <div className="flex items-center gap-1">
                  {EMOJI_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveEmojiCat(cat.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition cursor-pointer ${
                        activeEmojiCat === cat.id
                          ? 'bg-[#C8102E] text-white shadow-xs'
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

              <div className="p-3 max-h-60 overflow-y-auto grid grid-cols-7 gap-1.5 text-2xl">
                {currentCategoryObj.emojis.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInputChange(inputText + emoji)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-rose-50 dark:hover:bg-slate-700/60 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3">
              <input
                type="file"
                ref={stickerFileInputRef}
                onChange={onUploadSticker}
                accept="image/*"
                className="hidden"
              />
              <div className="grid grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
                {stickers.map((stk, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setShowMediaDrawer(false);
                      onSendMessage('', 'sticker', { stickerUrl: stk });
                    }}
                    className="aspect-square rounded-2xl overflow-hidden border border-rose-100 dark:border-slate-700 bg-rose-50/40 dark:bg-slate-800/60 p-1 cursor-pointer hover:border-[#C8102E] transition shadow-xs"
                  >
                    <img
                      src={stk}
                      alt="Custom Sticker"
                      loading="lazy"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pasted Image / Video Instant Preview Banner */}
      {pastedMedia && (
        <div className="px-4 py-2.5 bg-rose-50 dark:bg-[#161F33] border-t border-rose-200 dark:border-slate-700 flex items-center justify-between gap-3">
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
                {pastedMedia.isVideo ? '🎥 فيديو جاهز للإرسال' : '🖼️ صورة من الحافظة جاهزة للإرسال'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-300 truncate block">
                اضغط Enter أو زر الإرسال لإرسالها فوراً ⚡
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const file = pastedMedia.file;
                setPastedMedia(null);
                onSendMediaFile(file);
              }}
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
      <div className="px-3 sm:px-6 py-2.5 bg-[#FDF8F8] dark:bg-[#0B1120] border-t border-rose-100 dark:border-slate-800/80">
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
            <div className="flex-1 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#131B2E] border border-rose-200/80 dark:border-slate-700/80 shadow-xs focus-within:border-[#C8102E] transition">
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
                  if (e.key === 'Enter') triggerSend();
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
                    onSendMediaFile(file);
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
                className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
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
            onClick={triggerSend}
            className="w-10 h-10 rounded-full bg-[#C8102E] hover:bg-[#a80d26] text-white flex items-center justify-center shadow-md shadow-red-600/25 active:scale-95 transition cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4 fill-white -ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

