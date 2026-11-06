# ChatApp — Just You & Me ♡ (Couples Chat v2)

تطبيق محادثة خاص لشخصين فقط مبني بـ **React + Vite + Tailwind CSS + Supabase Realtime + Capacitor Android**.

---

## الخطوة 1: تجهيز الجداول والـ Realtime في Supabase
1. افتح مشروعك على [Supabase Dashboard](https://supabase.com/dashboard/project/mgktuovrhmkjvdqhhwbd).
2. ادخل على **SQL Editor** من القائمة الجانبية، وانسخ الكود الموجود في ملف [`supabase_setup.sql`](./supabase_setup.sql) بالكامل واضغط **Run**.

---

## الخطوة 2: إنشاء مساحة رفع الصور والستيكرات (Storage)
- الكود في `supabase_setup.sql` يقوم تلقائياً بإنشاء Bucket عام باسم `chat-media` وتفعيل صلاحيات `SELECT` و `INSERT` للجميع (`public`).
- يمكنك أيضاً التأكد من وجوده من القائمة الجانبية **Storage** -> **`chat-media`**.

---

## الخطوة 3: إضافة مفتاح Supabase وتشغيل نسخة الويب
1. افتح ملف [`.env.local`](./.env.local) وضع مفتاح الـ `anon public` الخاص بمشروعك من **Project Settings > API**:
   ```env
   VITE_SUPABASE_URL=https://mgktuovrhmkjvdqhhwbd.supabase.co
   VITE_SUPABASE_ANON_KEY=ضع_مفتاح_anon_هنا
   ```
   *(ملاحظة: يمكنك أيضاً لصق المفتاح مباشرة من داخل شاشة **Settings** داخل التطبيق).*

2. شغّل المشروع عبر الأوامر:
   ```bash
   npm install
   npm run dev
   ```
3. افتح `http://localhost:3000`:
   - **حسابك**: الاسم `ali` والرمز `1234`
   - **حسابها**: الاسم `love` والرمز `1234`

---

## الخطوة 4: تحويل المشروع إلى تطبيق أندرويد (APK)
في الـ Terminal داخل مجلد المشروع، شغّل الأوامر التالية بالترتيب:
```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```
بعد فتح Android Studio وانتهاء **Gradle Sync**، اختر من القائمة العلوية:
`Build > Build Bundle(s) / APK(s) > Build APK(s)`

