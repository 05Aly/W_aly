import React, { useState, useRef, useMemo } from 'react';
import {
  CornerUpLeft, Smile, Star, Pin, Check, CheckCheck, Play, Pause, Copy, Edit3, Trash2
} from 'lucide-react';

// Rich Text Formatter with Telegram Spoilers & Search Highlight
export const FormattedMessageText = React.memo(function FormattedMessageText({
  text,
  searchQuery
}: {
  text: string;
  searchQuery?: string;
}) {
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<number, boolean>>({});

  const parts = useMemo(() => {
    if (!text) return [];
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

        if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
          return (
            <strong key={idx} className="font-bold">
              {renderHighlighted(part.slice(1, -1), `b-${idx}`)}
            </strong>
          );
        }

        if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
          return (
            <em key={idx} className="italic">
              {renderHighlighted(part.slice(1, -1), `i-${idx}`)}
            </em>
          );
        }

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

interface MessageItemProps {
  msg: any;
  isMe: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isStarred: boolean;
  isPinned: boolean;
  dateGroupLabel: string | null;
  searchQuery: string;
  playingVoiceId: string | null;
  voicePlaybackSpeed: number;
  voiceCurrentTime?: number;
  voiceTotalTime?: number;
  onSelectMessage: (id: string | null) => void;
  onReply: (msg: any) => void;
  onEdit: (msg: any) => void;
  onDelete: (id: string) => void;
  onCopy: (text?: string) => void;
  onToggleReaction: (msgId: string, emoji: string, x?: number, y?: number) => void;
  onToggleStar: (msgId: string) => void;
  onTogglePin: (msgId: string) => void;
  onJumpToMessage: (msgId: string) => void;
  onOpenLightbox: (url: string) => void;
  onPlayVoice: (msg: any) => void;
  onCycleVoiceSpeed: () => void;
}

export const MessageItem = React.memo(function MessageItem({
  msg,
  isMe,
  isSelected,
  isHighlighted,
  isStarred,
  isPinned,
  dateGroupLabel,
  searchQuery,
  playingVoiceId,
  voicePlaybackSpeed,
  voiceCurrentTime,
  voiceTotalTime,
  onSelectMessage,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  onToggleReaction,
  onToggleStar,
  onTogglePin,
  onJumpToMessage,
  onOpenLightbox,
  onPlayVoice,
  onCycleVoiceSpeed
}: MessageItemProps) {
  // Local swipe state so swiping a single message never re-renders the rest of the chat
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const deltaX = e.touches[0].clientX - touchStartPos.current.x;
    const deltaY = e.touches[0].clientY - touchStartPos.current.y;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
      const clamped = Math.sign(deltaX) * Math.min(Math.abs(deltaX), 75);
      setIsSwiping(true);
      setSwipeOffset(clamped);
    }
  };

  const handleTouchEnd = () => {
    if (isSwiping && Math.abs(swipeOffset) >= 40) {
      onReply(msg);
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(20);
        }
      } catch {}
    }
    setIsSwiping(false);
    setSwipeOffset(0);
    touchStartPos.current = null;
  };

  const isPlayingThisVoice = playingVoiceId === msg.id;

  return (
    <>
      {dateGroupLabel && (
        <div className="flex justify-center my-3 select-none">
          <div className="px-3.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 dark:bg-[#1E2738] text-slate-600 dark:text-slate-300 shadow-2xs border border-rose-200/50 dark:border-slate-700/60">
            {dateGroupLabel}
          </div>
        </div>
      )}

      <div
        id={`msg-${msg.id}`}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSelectMessage(isSelected ? null : msg.id);
        }}
        onDoubleClick={() => {
          onReply(msg);
        }}
        className={`group flex flex-col relative w-full py-1 cursor-default select-none rounded-2xl ${
          isHighlighted ? 'highlight-jump bg-[#C8102E]/10 ring-2 ring-[#C8102E]/50 p-1' : ''
        } ${isMe ? 'items-end' : 'items-start'}`}
      >
        {/* Quoted Reply Box */}
        {msg.replyTo && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (msg.replyTo.id) onJumpToMessage(msg.replyTo.id);
            }}
            className={`text-[11px] mb-1 px-3 py-1.5 rounded-xl border-l-4 max-w-xs sm:max-w-md shadow-2xs transition cursor-pointer hover:opacity-90 ${
              isMe
                ? 'bg-rose-900/15 dark:bg-rose-950/60 text-slate-700 dark:text-slate-200 border-[#C8102E]'
                : 'bg-white dark:bg-[#1E2738] text-slate-700 dark:text-slate-300 border-rose-400'
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

        <div className="relative max-w-[85%] sm:max-w-md flex items-center gap-1.5">
          {/* Swipe-to-Reply Visual Indicator */}
          {isSwiping && Math.abs(swipeOffset) > 12 && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full pointer-events-none z-20 ${
                Math.abs(swipeOffset) >= 40
                  ? 'bg-[#C8102E] text-white scale-110 shadow-md'
                  : 'bg-rose-100 dark:bg-slate-800 text-[#C8102E] scale-90'
              } ${swipeOffset > 0 ? '-left-11' : '-right-11'}`}
            >
              <CornerUpLeft className={`w-4 h-4 ${swipeOffset < 0 ? 'scale-x-[-1]' : ''}`} />
            </div>
          )}

          {/* Desktop Quick Actions on Hover (Left side for My Messages) */}
          {isMe && (
            <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply(msg);
                }}
                className="p-1.5 rounded-full hover:bg-rose-100/70 dark:hover:bg-slate-800 text-slate-400 hover:text-[#C8102E] transition cursor-pointer"
                title="رد على الرسالة"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMessage(isSelected ? null : msg.id);
                }}
                className="p-1.5 rounded-full hover:bg-rose-100/70 dark:hover:bg-slate-800 text-slate-400 hover:text-[#C8102E] transition cursor-pointer"
                title="تفاعل أو خيارات"
              >
                <Smile className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Message Bubble Container */}
          <div
            style={{
              transform: swipeOffset ? `translateX(${swipeOffset}px)` : undefined,
              transition: isSwiping ? 'none' : 'transform 0.2s ease-out'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative max-w-full"
          >
            {msg.type === 'sticker' ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMessage(isSelected ? null : msg.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectMessage(isSelected ? null : msg.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onToggleReaction(msg.id, '❤️', e.clientX, e.clientY);
                }}
                className="relative inline-block cursor-pointer group"
              >
                <img
                  src={msg.stickerUrl}
                  alt="Sent media"
                  loading="lazy"
                  className="max-w-[230px] sm:max-w-[280px] max-h-72 w-auto h-auto object-cover rounded-2xl shadow-sm border border-rose-200/50 dark:border-slate-700/60"
                />
                {msg.isUploading && (
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#C8102E] text-white text-[10px] font-semibold shadow-xs">
                    جاري الرفع... ⚡
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLightbox(msg.stickerUrl);
                  }}
                  className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/70 text-white text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  title="تكبير الصورة"
                >
                  تكبير 🔍
                </button>
                <span className="absolute bottom-1.5 right-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-medium flex items-center gap-1">
                  {isStarred && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}
                  {isPinned && <Pin className="w-3 h-3 fill-[#C8102E] text-[#C8102E] shrink-0" />}
                  <span>{msg.time}</span>
                  {isMe &&
                    (msg.status === 'read' ? (
                      <CheckCheck className="w-3 h-3 text-white stroke-[2.2]" />
                    ) : (
                      <Check className="w-3 h-3 text-white/80 stroke-[2]" />
                    ))}
                </span>
              </div>
            ) : msg.type === 'video' ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMessage(isSelected ? null : msg.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectMessage(isSelected ? null : msg.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onToggleReaction(msg.id, '❤️', e.clientX, e.clientY);
                }}
                className={`relative p-1.5 rounded-2xl shadow-sm cursor-pointer ${
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
                    <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#C8102E] text-white text-[10px] font-semibold shadow-xs">
                      جاري رفع الفيديو... ⚡
                    </span>
                  )}
                </div>
                <div
                  className={`flex items-center justify-end gap-1 px-2 pt-1 text-[10px] ${
                    isMe ? 'text-rose-100' : 'text-slate-400'
                  }`}
                >
                  {isStarred && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}
                  {isPinned && <Pin className="w-3 h-3 fill-[#C8102E] text-[#C8102E] shrink-0" />}
                  <span>🎥 فيديو</span>
                  <span>•</span>
                  <span>{msg.time}</span>
                  {isMe &&
                    (msg.status === 'read' ? (
                      <CheckCheck className="w-3.5 h-3.5 text-white stroke-[2.2]" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-white/80 stroke-[2]" />
                    ))}
                </div>
              </div>
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMessage(isSelected ? null : msg.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectMessage(isSelected ? null : msg.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onToggleReaction(msg.id, '❤️', e.clientX, e.clientY);
                }}
                className={`relative px-4 py-2.5 cursor-pointer shadow-xs ${
                  isMe
                    ? 'bg-[#C8102E] text-white rounded-2xl rounded-br-xs'
                    : 'bg-white dark:bg-[#1E2738] text-slate-900 dark:text-slate-100 rounded-2xl rounded-bl-xs border border-rose-100/70 dark:border-slate-700/60'
                }`}
              >
                {msg.type === 'text' && (
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <FormattedMessageText text={msg.text || ''} searchQuery={searchQuery} />
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
                      {isMe &&
                        (msg.status === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-white stroke-[2.2]" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-white/80 stroke-[2]" />
                        ))}
                    </span>
                  </div>
                )}

                {msg.type === 'voice' && (
                  <div className="flex items-center gap-2.5 min-w-[210px] sm:min-w-[230px] py-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayVoice(msg);
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs cursor-pointer ${
                        isMe ? 'bg-white text-[#C8102E]' : 'bg-[#C8102E] text-white'
                      }`}
                    >
                      {isPlayingThisVoice ? (
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
                              className={`w-1 rounded-full ${
                                isMe ? 'bg-white/80' : 'bg-[#C8102E]/70'
                              }`}
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
                          {isPlayingThisVoice && voiceCurrentTime !== undefined
                            ? `0:0${voiceCurrentTime} / 0:0${voiceTotalTime || msg.voiceDuration || 3}`
                            : `0:0${msg.voiceDuration || 3}`}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCycleVoiceSpeed();
                            }}
                            className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold border ${
                              isMe
                                ? 'border-white/40 bg-white/15 text-white'
                                : 'border-rose-300 dark:border-slate-600 bg-rose-50 dark:bg-slate-700 text-[#C8102E] dark:text-rose-300'
                            }`}
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
                          {isMe &&
                            (msg.status === 'read' ? (
                              <CheckCheck className="w-3 h-3 text-white stroke-[2.2]" />
                            ) : (
                              <Check className="w-3 h-3 text-white/80 stroke-[2]" />
                            ))}
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
                className={`absolute -bottom-2.5 flex items-center gap-0.5 bg-white dark:bg-[#1E2738] px-2 py-0.5 rounded-full shadow-sm border border-rose-100 dark:border-slate-700 text-xs z-10 ${
                  isMe ? 'right-2' : 'left-2'
                }`}
              >
                {msg.reactions.map((r: string, i: number) => (
                  <span key={i}>{r}</span>
                ))}
              </div>
            )}

            {/* Floating Action & Reaction Menu */}
            {isSelected && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`absolute z-30 mt-1.5 flex flex-col items-center bg-white dark:bg-[#1E2738] rounded-2xl shadow-xl border border-rose-100 dark:border-slate-700 p-2 min-w-[220px] ${
                  isMe ? 'right-0' : 'left-0'
                }`}
              >
                <div className="flex items-center justify-around w-full pb-2 mb-1.5 border-b border-rose-100 dark:border-slate-700">
                  {['❤️', '😍', '😂', '🥺', '🔥', '😘'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={(e) => onToggleReaction(msg.id, emoji, e.clientX, e.clientY)}
                      className="hover:scale-125 p-1 transition-transform text-sm cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-1 w-full text-center">
                  <button
                    onClick={() => {
                      onReply(msg);
                      onSelectMessage(null);
                    }}
                    className="flex flex-col items-center gap-1 p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5 text-[#C8102E]" />
                    <span>رد</span>
                  </button>

                  {msg.type === 'text' && (
                    <button
                      onClick={() => onCopy(msg.text)}
                      className="flex flex-col items-center gap-1 p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>نسخ</span>
                    </button>
                  )}

                  <button
                    onClick={() => onToggleStar(msg.id)}
                    className="flex flex-col items-center gap-1 p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <span>{isStarred ? 'إلغاء' : 'نجمة'}</span>
                  </button>

                  <button
                    onClick={() => onTogglePin(msg.id)}
                    className="flex flex-col items-center gap-1 p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Pin
                      className={`w-3.5 h-3.5 ${
                        isPinned ? 'fill-[#C8102E] text-[#C8102E]' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <span>{isPinned ? 'إلغاء' : 'تثبيت'}</span>
                  </button>

                  {isMe && msg.type === 'text' && (
                    <button
                      onClick={() => {
                        onEdit(msg);
                        onSelectMessage(null);
                      }}
                      className="flex flex-col items-center gap-1 p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                      <span>تعديل</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDelete(msg.id)}
                    className="flex flex-col items-center gap-1 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl text-[10px] font-medium text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Quick Actions on Hover (Right side for Partner Messages) */}
          {!isMe && (
            <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply(msg);
                }}
                className="p-1.5 rounded-full hover:bg-rose-100/70 dark:hover:bg-slate-800 text-slate-400 hover:text-[#C8102E] transition cursor-pointer"
                title="رد على الرسالة"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMessage(isSelected ? null : msg.id);
                }}
                className="p-1.5 rounded-full hover:bg-rose-100/70 dark:hover:bg-slate-800 text-slate-400 hover:text-[#C8102E] transition cursor-pointer"
                title="تفاعل أو خيارات"
              >
                <Smile className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

