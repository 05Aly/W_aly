import React from 'react';
import { Heart } from 'lucide-react';

interface AboutPageProps {
  daysTogether: number;
  onBackToChat: () => void;
}

export const AboutPage = React.memo(function AboutPage({
  daysTogether,
  onBackToChat
}: AboutPageProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#FDF8F8] dark:bg-[#0B1120]">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#131B2E] border border-rose-200/70 dark:border-slate-800 text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-[#C8102E] text-white flex items-center justify-center mx-auto shadow-lg shadow-red-600/30">
          <Heart className="w-7 h-7 fill-white" />
        </div>
        <h2 className="text-xl font-bold">ChatApp — Just You & Me ♡</h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          تطبيق محادثة خاص مصمم خصيصاً لكما فقط. يعمل بتزامن لحظي فائق الخفة عبر الويب والأندرويد مع حفظ جلسة الدخول تلقائياً لكل طرف.
        </p>
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-[#1E2738] text-xs font-semibold text-[#C8102E] dark:text-rose-300">
          معاً منذ {daysTogether} يوماً ❤️
        </div>
        <button
          onClick={onBackToChat}
          className="w-full py-2.5 rounded-xl bg-[#C8102E] text-white text-xs font-semibold cursor-pointer"
        >
          العودة إلى الشات
        </button>
      </div>
    </div>
  );
});

