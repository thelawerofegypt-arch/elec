
import React from 'react';
import { Monitor, Cpu, Download, ShieldCheck, Terminal, ExternalLink } from 'lucide-react';

const DesktopInstructions: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="bg-emerald-900 text-white p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-4">كيفية تشغيل النظام كبرنامج مستقل (.exe)</h2>
          <p className="text-emerald-100 text-lg opacity-90 leading-relaxed mb-6">
            هذا النظام مصمم ليعمل بتقنيات الويب الحديثة، مما يوفر له مرونة هائلة. إليك الطرق الرسمية لتحويله إلى برنامج مكتبي:
          </p>
          <div className="flex gap-4">
            <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-md">
              <span className="block text-2xl font-bold mb-1">0%</span>
              <span className="text-xs text-emerald-200 uppercase tracking-wider">تكلفة إضافية</span>
            </div>
            <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-md">
              <span className="block text-2xl font-bold mb-1">100%</span>
              <span className="text-xs text-emerald-200 uppercase tracking-wider">خصوصية البيانات</span>
            </div>
          </div>
        </div>
        <Monitor size={200} className="absolute -left-10 -bottom-10 text-white/5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Method 1: PWA */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
            <Download size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">الطريقة الأولى: التثبيت عبر المتصفح (PWA)</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            هذه هي الطريقة الرسمية لشركة Microsoft و Google. تتيح لك تثبيت "نسخة سطح المكتب" من النظام بضغطة زر واحدة دون الحاجة لتحميل ملفات خارجية.
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              افتح النظام في Google Chrome أو Microsoft Edge.
            </li>
            <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              اضغط على زر "تثبيت البرنامج" الموجود في القائمة الجانبية.
            </li>
            <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              ستظهر أيقونة النظام فوراً على سطح مكتبك.
            </li>
          </ul>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <ShieldCheck className="text-emerald-600 shrink-0" size={20} />
            <p className="text-xs text-slate-500 italic">ميزة هذه الطريقة: التحديثات التلقائية والأمان العالي.</p>
          </div>
        </div>

        {/* Method 2: Nativefier */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
            <Terminal size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">الطريقة الثانية: استخراج ملف EXE حقيقي</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            إذا كنت بحاجة لملف `.exe` مستقل تماماً لتوزيعه عبر الفلاش ميموري، يمكنك استخدام أداة Nativefier.
          </p>
          <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs mb-6 overflow-x-auto">
            <code>npx nativefier --name "AdminSystem" "رابط_النظام"</code>
          </div>
          <div className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              <Cpu size={14} className="inline ml-1" /> يتطلب هذا الإجراء وجود بيئة Node.js على جهاز المطور.
            </p>
            <a 
              href="https://github.com/nativefier/nativefier" 
              target="_blank" 
              className="inline-flex items-center gap-2 text-purple-600 font-bold hover:underline"
            >
              عرض شرح الأداة التقني
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
          <Monitor size={20} />
        </div>
        <div>
          <h4 className="font-bold text-amber-900 mb-1">ملاحظة هامة حول قواعد البيانات</h4>
          <p className="text-sm text-amber-800 leading-relaxed">
            النظام الحالي يستخدم التخزين المحلي (LocalStorage). إذا تم تشغيله كـ EXE، سيتم حفظ البيانات في مجلد بيانات المستخدم الخاص بالبرنامج على الويندوز. لضمان عدم ضياع البيانات، يرجى دائماً استخدام خاصية "تصدير التقارير" لعمل نسخة احتياطية دورية.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DesktopInstructions;
