
import React, { useState } from 'react';
import { 
  BookOpen, 
  Monitor, 
  HardDrive, 
  ShieldCheck, 
  Smartphone, 
  Globe,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Server,
  Cloud,
  Rocket
} from 'lucide-react';

const HandoverGuide: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      title: "التثبيت على أجهزة الكمبيوتر",
      desc: "افتح الرابط عبر Chrome أو Edge، ثم اضغط على أيقونة (تثبيت) في شريط العنوان ليظهر البرنامج كأيقونة على سطح المكتب.",
      icon: <Monitor className="text-blue-600" />,
      color: "bg-blue-50"
    },
    {
      title: "نقل البيانات وتداولها",
      desc: "للانتقال من جهاز لآخر، استخدم خاصية (تصدير نسخة احتياطية) من الإعدادات وارفع الملف على الجهاز الجديد.",
      icon: <HardDrive className="text-emerald-600" />,
      color: "bg-emerald-50"
    },
    {
      title: "تأمين الحسابات",
      desc: "يجب تغيير كلمة المرور الافتراضية فور استلام النظام. البيانات مشفرة محلياً ولا يتم رفعها على أي خوادم خارجية.",
      icon: <ShieldCheck className="text-purple-600" />,
      color: "bg-purple-50"
    },
    {
      title: "التشغيل دون إنترنت",
      desc: "بمجرد التثبيت، يمكن للبرنامج العمل بالكامل دون الحاجة لاتصال بالإنترنت، حيث يتم حفظ السجلات في ذاكرة الجهاز.",
      icon: <Smartphone className="text-amber-600" />,
      color: "bg-amber-50"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Main Header */}
      <div className="bg-emerald-900 text-white p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-4xl font-bold mb-4">دليل التسليم والاستضافة</h2>
          <p className="text-emerald-100 text-lg opacity-90 leading-relaxed">
            بصفتك المسؤول عن تسليم النظام للنيابة الإدارية، إليك كافة المعلومات التقنية للحصول على رابط التشغيل النهائي.
          </p>
        </div>
        <BookOpen size={240} className="absolute -left-10 -bottom-10 text-white/5 rotate-12" />
      </div>

      {/* NEW: Final Link Section */}
      <div className="bg-white p-8 rounded-3xl border-2 border-emerald-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600"></div>
        <div className="flex items-center gap-3 mb-6">
          <Rocket className="text-emerald-600" size={32} />
          <h3 className="text-2xl font-bold text-slate-800">رابط التسليم النهائي</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <p className="text-slate-600 leading-relaxed">
              الرابط أدناه هو رابط "المعاينة الحالية". يمكنك إرساله للجهة الطالبة للبدء في الاختبار فوراً. للحصول على رابط باسم الهيئة (مثل niaba.gov.eg)، يجب رفع الملفات على خادمهم الخاص.
            </p>
            
            <div className="flex items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl group">
              <code className="flex-1 text-sm text-emerald-700 font-mono truncate">
                {window.location.href}
              </code>
              <button 
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                  copied ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'تم النسخ' : 'نسخ الرابط'}
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-amber-600 font-bold bg-amber-50 p-3 rounded-lg">
              <Globe size={14} />
              ملاحظة: هذا الرابط يعمل عبر الإنترنت ويحتاج لمتصفح حديث (Chrome / Edge).
            </div>
          </div>

          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex flex-col justify-center text-center">
            <Share2 className="mx-auto text-emerald-600 mb-3" size={40} />
            <h4 className="font-bold text-emerald-900 mb-2">مشاركة النظام</h4>
            <p className="text-xs text-emerald-800 opacity-75 mb-4 leading-relaxed">
              يمكنك إرسال هذا الرابط عبر الواتساب أو البريد الإلكتروني لمسؤول تكنولوجيا المعلومات بالنيابة.
            </p>
            <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
              <ExternalLink size={16} />
              فتح في نافذة جديدة
            </button>
          </div>
        </div>
      </div>

      {/* Deployment Options Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
          <Server className="text-blue-600" size={28} />
          <h3 className="text-2xl font-bold text-slate-800">خيارات الاستضافة الاحترافية</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 relative group overflow-hidden">
            <Cloud size={80} className="absolute -right-4 -bottom-4 text-blue-200/50 group-hover:rotate-12 transition-transform" />
            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <Cloud size={20} />
              نشر عبر Vercel (مجاني)
            </h4>
            <p className="text-sm text-blue-800/80 leading-relaxed mb-4">
              أفضل خيار للحصول على رابط سريع مثل <code>niaba-sys.vercel.app</code> بضغطة زر واحدة من خلال حساب GitHub.
            </p>
            <ul className="text-[11px] text-blue-700 space-y-1">
              <li>• استقرار عالي بنسبة 99.9%</li>
              <li>• تحديثات تلقائية بمجرد تعديل الكود</li>
              <li>• شهادة أمان SSL مجانية (HTTPS)</li>
            </ul>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group overflow-hidden">
            <Server size={80} className="absolute -right-4 -bottom-4 text-slate-200/50 group-hover:rotate-12 transition-transform" />
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Server size={20} />
              خادم النيابة الداخلي (Intranet)
            </h4>
            <p className="text-sm text-slate-800/80 leading-relaxed mb-4">
              الخيار الأكثر أماناً للهيئات القضائية. يتم رفع ملفات النظام على سيرفر داخل شبكة الهيئة المغلقة.
            </p>
            <ul className="text-[11px] text-slate-700 space-y-1">
              <li>• لا يتطلب إنترنت للتشغيل</li>
              <li>• تحكم كامل في سرية البيانات</li>
              <li>• التوافق مع جدران الحماية السيادية</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              {step.icon}
            </div>
            <h3 className="font-bold text-slate-800 mb-2">{step.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HandoverGuide;
