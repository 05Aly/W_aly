import React, { useState, useRef, useEffect } from 'react';
import {
  PenTool, X, Heart, Phone, Star, Film, Mic, Trash2, Volume2
} from 'lucide-react';
import { dataURLtoBlob } from '../constants/chatData';
import { uploadMediaToStorage } from '../lib/supabase';

interface ChatModalsProps {
  darkMode: boolean;
  isCanvasOpen: boolean;
  activeCallModal: string | null;
  lightboxImageUrl: string | null;
  showStarredModal: boolean;
  showSharedMediaModal: boolean;
  partnerDisplayName: string;
  messages: any[];
  starredMsgIds: string[];
  stickers: string[];
  profiles: Record<string, any>;
  onCloseCanvas: () => void;
  onCloseCallModal: () => void;
  onCloseLightbox: () => void;
  onCloseStarredModal: () => void;
  onCloseSharedMediaModal: () => void;
  onOpenLightbox: (url: string) => void;
  onJumpToMessage: (id: string) => void;
  onToggleStarMessage: (id: string) => void;
  onSendMessage: (content: string, type: string, extra?: any) => void;
}

export const ChatModals = React.memo(function ChatModals({
  darkMode,
  isCanvasOpen,
  activeCallModal,
  lightboxImageUrl,
  showStarredModal,
  showSharedMediaModal,
  partnerDisplayName,
  messages,
  starredMsgIds,
  stickers,
  profiles,
  onCloseCanvas,
  onCloseCallModal,
  onCloseLightbox,
  onCloseStarredModal,
  onCloseSharedMediaModal,
  onOpenLightbox,
  onJumpToMessage,
  onToggleStarMessage,
  onSendMessage
}: ChatModalsProps) {
  const [sharedMediaTab, setSharedMediaTab] = useState<'media' | 'voice' | 'stickers'>('media');

  // Doodle Canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#C8102E');

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
    ctx.lineWidth = 4;
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
    onSendMessage('', 'sticker', { stickerUrl: finalUrl });
    onCloseCanvas();
  };

  if (
    !isCanvasOpen &&
    !activeCallModal &&
    !lightboxImageUrl &&
    !showStarredModal &&
    !showSharedMediaModal
  ) {
    return null;
  }

  return (
    <>
      {/* MODAL 1: LOVE DOODLE CANVAS */}
      {isCanvasOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#131B2E] rounded-3xl p-5 shadow-2xl border border-rose-200 dark:border-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-[#C8102E]" />
                <h3 className="font-bold text-sm">ارسم رسالة حب بيدك ♡</h3>
              </div>
              <button
                onClick={onCloseCanvas}
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
        <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4">
          <div className="w-full max-w-xs rounded-3xl bg-[#131B2E] border border-slate-800 p-8 text-center text-white space-y-5 shadow-2xl">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[#C8102E]/40 animate-ping"></span>
              <div className="relative w-20 h-20 rounded-full bg-[#C8102E] flex items-center justify-center ring-4 ring-rose-500/30">
                <Heart className="w-9 h-9 fill-white text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg">{partnerDisplayName}</h3>
              <p className="text-xs text-rose-300 mt-1">
                {activeCallModal === 'video' ? 'جاري الاتصال فيديو ❤️...' : 'جاري الاتصال صوتياً ❤️...'}
              </p>
            </div>
            <button
              onClick={onCloseCallModal}
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
          onClick={onCloseLightbox}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        >
          <button
            onClick={onCloseLightbox}
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

      {/* MODAL 4: STARRED ROMANTIC MESSAGES */}
      {showStarredModal && (
        <div
          onClick={onCloseStarredModal}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85vh] bg-white dark:bg-[#131B2E] rounded-3xl p-5 shadow-2xl border border-rose-200 dark:border-slate-700 flex flex-col"
          >
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
                onClick={onCloseStarredModal}
                className="p-1.5 rounded-full text-slate-400 hover:text-[#C8102E] hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {starredMsgIds.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Star className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 stroke-1" />
                  <p className="text-xs">لم تقم بتمييز أي رسالة بنجمة بعد.</p>
                </div>
              ) : (
                messages
                  .filter((m) => starredMsgIds.includes(m.id))
                  .map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-[#1A2234] border border-rose-100 dark:border-slate-700/80 flex items-start justify-between gap-3"
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
                            className="w-20 h-20 object-cover rounded-xl mt-1"
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
                            onCloseStarredModal();
                            onJumpToMessage(m.id);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#C8102E] hover:text-white text-slate-600 dark:text-slate-300 text-[11px] font-semibold border border-rose-200/60 dark:border-slate-700 transition cursor-pointer"
                        >
                          انتقال
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleStarMessage(m.id)}
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
          onClick={onCloseSharedMediaModal}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#131B2E] rounded-3xl p-5 shadow-2xl border border-rose-200 dark:border-slate-700 flex flex-col"
          >
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
                onClick={onCloseSharedMediaModal}
                className="p-1.5 rounded-full text-slate-400 hover:text-[#C8102E] hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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

            <div className="flex-1 overflow-y-auto py-3">
              {sharedMediaTab === 'media' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {messages
                    .filter((m) => m.type === 'sticker' || m.type === 'video')
                    .map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (m.stickerUrl) onOpenLightbox(m.stickerUrl);
                          else if (m.id) {
                            onCloseSharedMediaModal();
                            onJumpToMessage(m.id);
                          }
                        }}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-black/10 dark:bg-slate-800 border border-rose-100 dark:border-slate-700 cursor-pointer shadow-xs"
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
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded-md bg-black/60 text-white text-[9px]">
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
                            onCloseSharedMediaModal();
                            onJumpToMessage(m.id);
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
                        onCloseSharedMediaModal();
                        onSendMessage('', 'sticker', { stickerUrl: stk });
                      }}
                      className="aspect-square rounded-2xl overflow-hidden border border-rose-100 dark:border-slate-700 p-1 bg-white dark:bg-slate-800 hover:border-[#C8102E] transition cursor-pointer shadow-2xs"
                    >
                      <img src={stk} alt="Sticker" loading="lazy" className="w-full h-full object-cover rounded-xl" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
});

