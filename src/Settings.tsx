
import React, { useRef, useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  RefreshCw, 
  FileJson, 
  FileSpreadsheet, 
  ShieldAlert,
  Share2,
  CheckCircle2,
  XCircle,
  Monitor
} from 'lucide-react';
import { db } from '../utils/db';
import * as XLSX from 'xlsx';

interface Props {
  currentAdmin: any;
}

const Settings: React.FC<Props> = ({ currentAdmin }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pwaStatus, setPwaStatus] = useState<'checking' | 'ready' | 'not-ready'>('checking');
  
  const isDataEntry = currentAdmin?.role === 'مدخل بيانات';

  useEffect(() => {
    // Check if PWA criteria are met
    const checkPwa = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
          setPwaStatus('ready');
        } else {
          // Wait a bit and check again
          setTimeout(async () => {
            const reg = await navigator.serviceWorker.getRegistration();
            setPwaStatus(reg && reg.active ? 'ready' : 'not-ready');
          }, 3000);
        }
      } else {
        setPwaStatus('not-ready');
      }
    };
    checkPwa();
  }, []);

  const handleExportJSON = async () => {
    setIsProcessing(true);
    try {
      const data = {
        metadata: {
          version: "1.2.0",
          exportDate: new Date().toISOString(),
          exportedBy: currentAdmin.name
        },
        employees: await db.employees.toArray(),
        assignments: await db.assignments.toArray(),
        admins: await db.admins.toArray(),
        prosecutions: await db.prosecutions.toArray()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `NI_DB_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('فشل في تصدير البيانات بصيغة JSON');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('تنبيه: سيتم استبدال كافة البيانات الحالية ببيانات الملف المختار. هل تريد المتابعة؟')) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.employees || !data.assignments) throw new Error('ملف غير صالح');

        await (db as any).transaction('rw', [db.employees, db.assignments, db.admins, db.prosecutions], async () => {
          await db.employees.clear();
          await db.assignments.clear();
          await db.admins.clear();
          await db.prosecutions.clear();

          await db.employees.bulkAdd(data.employees);
          await db.assignments.bulkAdd(data.assignments);
          await db.admins.bulkAdd(data.admins);
          await db.prosecutions.bulkAdd(data.prosecutions);
        });

        alert('تمت استعادة قاعدة البيانات بنجاح.');
        window.location.reload();
      } catch (err) {
        alert('خطأ: الملف الذي اخترته ليس ملف نسخة احتياطية صالح للنظام.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = async () => {
    setIsProcessing(true);
    try {
      const employees = await db.employees.toArray();
      const worksheet = XLSX.utils.json_to_sheet(employees);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Employees_List_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportXLSX = async () => {
    setIsProcessing(true);
    try {
      const [employees, assignments, admins, prosecutions] = await Promise.all([
        db.employees.toArray(),
        db.assignments.toArray(),
        db.admins.toArray(),
        db.prosecutions.toArray()
      ]);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(employees), "الموظفين");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(assignments), "الانتدابات");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(admins), "المسؤولين");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(prosecutions), "النيابات");

      XLSX.writeFile(workbook, `NI_EXCEL_BACKUP_${new Date().toISOString().split('T')[0]}.xlsx`);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAllData = async () => {
    if (confirm('تنبيه أمني خطير: سيتم حذف قاعدة البيانات بالكامل ولا يمكن الرجوع. هل أنت متأكد؟')) {
      const password = prompt('أدخل كلمة المرور الخاصة بك للتأكيد:');
      if (password === currentAdmin.password) {
        await (db as any).delete();
        window.location.reload();
      } else {
        alert('كلمة مرور خاطئة، تم إلغاء العملية.');
      }
    }
  };

  if (isDataEntry) return <div className="p-20 text-center text-slate-400 font-bold">عفواً، لا تملك صلاحية الوصول لإعدادات النظام المتقدمة.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12">
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-emerald-900 p-10 text-white relative">
            <div className="relative z-10">
              <h3 className="text-3xl font-black mb-2 flex items-center gap-4">
                <Database size={40} className="text-emerald-400" /> 
                مركز إدارة البيانات
              </h3>
              <p className="text-emerald-100 opacity-80 font-medium italic">تحكم كامل في قواعد البيانات، النسخ الاحتياطي، والتوافقية البرمجية</p>
            </div>
            <ShieldAlert size={180} className="absolute -left-10 -bottom-10 text-white/5 rotate-12" />
        </div>

        <div className="p-10 space-y-12">
          {/* PWA Readiness Checker */}
          <section className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${pwaStatus === 'ready' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                <Monitor size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-800">حالة التثبيت (PWA)</h4>
                <p className="text-xs text-slate-500 font-bold">للتشغيل كبرنامج مستقل دون إنترنت</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pwaStatus === 'checking' && (
                <span className="flex items-center gap-2 text-blue-600 font-bold text-sm animate-pulse">
                  <RefreshCw size={16} className="animate-spin" /> جاري فحص النظام...
                </span>
              )}
              {pwaStatus === 'ready' && (
                <span className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <CheckCircle2 size={16} /> النظام جاهز للتثبيت من شريط العنوان
                </span>
              )}
              {pwaStatus === 'not-ready' && (
                <span className="flex items-center gap-2 text-red-500 font-bold text-sm">
                  <XCircle size={16} /> افتح النظام في نافذة جديدة (Top Window) لتفعيله
                </span>
              )}
            </div>
          </section>

          {/* قسم التصدير والاستيراد البرمجي (JSON/CSV) */}
          <section className="space-y-6">
            <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-r-4 border-emerald-600 pr-3">
              <Share2 size={24} className="text-emerald-600" />
              تداول البيانات الاحترافي (JSON / CSV)
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:border-emerald-200 transition-all">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileJson className="text-emerald-600" size={32} />
                  </div>
                  <h5 className="font-bold text-slate-800 mb-2">تصدير برمجي (JSON)</h5>
                  <p className="text-[10px] text-slate-500 mb-6 leading-relaxed">أفضل صيغة لنقل البيانات بين أجهزة النظام.</p>
                  <button onClick={handleExportJSON} disabled={isProcessing} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md flex items-center justify-center gap-2">
                    {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />} تصدير JSON
                  </button>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:border-blue-200 transition-all">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="text-blue-600" size={32} />
                  </div>
                  <h5 className="font-bold text-slate-800 mb-2">استعادة برمجية (JSON)</h5>
                  <p className="text-[10px] text-slate-500 mb-6 leading-relaxed">استعادة قاعدة البيانات بالكامل من ملف JSON.</p>
                  <button onClick={() => jsonInputRef.current?.click()} disabled={isProcessing} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md flex items-center justify-center gap-2">
                    {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Upload size={18} />} استيراد JSON
                  </button>
                  <input type="file" ref={jsonInputRef} className="hidden" accept=".json" onChange={handleImportJSON} />
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:border-amber-200 transition-all">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="text-amber-600" size={32} />
                  </div>
                  <h5 className="font-bold text-slate-800 mb-2">كشف CSV للموظفين</h5>
                  <p className="text-[10px] text-slate-500 mb-6 leading-relaxed">تصدير قائمة الموظفين فقط بصيغة CSV.</p>
                  <button onClick={handleExportCSV} disabled={isProcessing} className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 shadow-md flex items-center justify-center gap-2">
                    <Download size={18} /> تصدير CSV
                  </button>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-r-4 border-blue-600 pr-3">
              <FileSpreadsheet size={24} className="text-blue-600" />
              تصدير التقارير الشاملة (Excel)
            </h4>
            <div className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100 flex items-center justify-between gap-6">
              <div className="flex-1">
                <p className="text-sm text-blue-900 font-bold mb-1">ملف إكسل شامل (XLSX)</p>
                <p className="text-xs text-blue-700 leading-relaxed">يحتوي الملف على كافة تبويبات النظام في مستند واحد.</p>
              </div>
              <button onClick={handleExportXLSX} className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg flex items-center gap-3 shrink-0">
                <Download size={24} /> تصدير ملف إكسل متكامل
              </button>
            </div>
          </section>

          <div className="pt-8 border-t border-slate-100">
            <div className="p-8 bg-red-50 rounded-[2rem] border border-red-100 border-dashed flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 text-red-600 rounded-2xl mt-1">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h4 className="text-red-800 font-black text-lg">تصفير قاعدة البيانات بالكامل</h4>
                    <p className="text-xs text-red-600/70 font-bold leading-relaxed">
                      سيؤدي هذا الإجراء إلى حذف كافة السجلات بشكل نهائي.
                    </p>
                  </div>
                </div>
                <button onClick={clearAllData} className="px-10 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl active:scale-95 shrink-0">
                  بدء التصفير الأمني الشامل
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
