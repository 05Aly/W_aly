-- ============================================================================
-- الخطوة 1: تجهيز الجداول والـ Realtime في Supabase
-- انسخ هذا الكود بالكامل والصقه في SQL Editor داخل Supabase ثم اضغط Run
-- ============================================================================

-- 1. جدول المستخدمين
CREATE TABLE IF NOT EXISTS app_users (
  username TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  mood_text TEXT DEFAULT 'بيفكر فيك ❤️',
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- إدخال حسابك وحسابها فقط
INSERT INTO app_users (username, display_name, pin_code, mood_text) VALUES
  ('ali', 'Ali', '1234', 'في الشغل 💻'),
  ('love', 'My Love ♡', '1234', 'مشتاقة لك ❤️')
ON CONFLICT (username) DO NOTHING;

-- 2. جدول الرسائل
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender TEXT NOT NULL REFERENCES app_users(username),
  type TEXT DEFAULT 'text',
  content TEXT,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  reactions JSONB DEFAULT '[]'::jsonb,
  is_edited BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول الإعدادات المشتركة (الخلفية وعداد الأيام)
CREATE TABLE IF NOT EXISTS chat_settings (
  id INT PRIMARY KEY DEFAULT 1,
  wallpaper_url TEXT DEFAULT '',
  relationship_start_date DATE DEFAULT '2024-01-01',
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO chat_settings (id, wallpaper_url, relationship_start_date) VALUES
  (1, '', '2024-01-01')
ON CONFLICT (id) DO NOTHING;

-- 4. جدول الستيكرات
CREATE TABLE IF NOT EXISTS custom_stickers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  added_by TEXT REFERENCES app_users(username),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. تفعيل الـ Realtime لجميع الجداول
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE custom_stickers;
ALTER PUBLICATION supabase_realtime ADD TABLE app_users;

-- 6. إيقاف الـ RLS لتسهيل الاتصال المباشر
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_stickers DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- الخطوة 2 (اختياري عبر SQL): إنشاء الـ Storage Bucket تلقائياً باسم chat-media
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access chat-media SELECT" ON storage.objects;
CREATE POLICY "Public Access chat-media SELECT"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "Public Access chat-media INSERT" ON storage.objects;
CREATE POLICY "Public Access chat-media INSERT"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'chat-media');

