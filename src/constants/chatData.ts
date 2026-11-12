// Private Pre-Configured Couple Accounts
export const COUPLE_ACCOUNTS: Record<string, any> = {
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

export const USERNAME_TO_ID: Record<string, string> = {
  ali: 'user1',
  love: 'user2'
};

export const ID_TO_USERNAME: Record<string, string> = {
  user1: 'ali',
  user2: 'love'
};

export const MOOD_PRESETS = [
  'بيفكر فيك ❤️',
  'مشتاقلك أوي 🥺',
  'في الشغل 💻',
  'نايم 😴',
  'بسمع مزيكا 🎶',
  'مستني رسالتك 💌',
  'بحبك قد الدنيا 🌎❤️'
];

// Preset Romantic Stickers
export const INITIAL_STICKERS = [
  'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=240&auto=format&fit=crop&q=80'
];

// Rich Emoji Categories
export const EMOJI_CATEGORIES = [
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

export function formatTimeFromISO(isoString?: string) {
  const date = isoString ? new Date(isoString) : new Date();
  if (isNaN(date.getTime())) return 'Now';
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function dataURLtoBlob(dataurl: string): Blob | null {
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

export function getMessageDateGroup(timestamp?: number): string {
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

export function calculateDaysTogether(anniversaryDate: string): number {
  const start = new Date(anniversaryDate);
  if (isNaN(start.getTime())) return 365;
  return Math.max(1, Math.ceil((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

