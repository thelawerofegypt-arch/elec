import React, { useState } from 'react';
import { Building2, Plus, Trash2, MapPin, Search, Users, X, Info, FileSpreadsheet, CheckCircle2, Cake, Printer, FileText } from 'lucide-react';
import { Prosecution, Employee } from '../types';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, AlignmentType, TextRun, WidthType, BorderStyle } from 'docx';
import saveAs from 'file-saver';

interface Props {
  prosecutions: Prosecution[];
  setProsecutions: React.Dispatch<React.SetStateAction<Prosecution[]>>;
  employees: Employee[];
  currentAdmin: any;
  onImportSuccess?: () => void;
}

const ProsecutionManagement: React.FC<Props> = ({ prosecutions, setProsecutions, employees, currentAdmin, onImportSuccess }) => {
  const [newName, setNewName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingProsecution, setViewingProsecution] = useState<Prosecution | null>(null);
  const [showImportGuide, setShowImportGuide] = useState(false);

  const calculateAge = (nationalId: string): number | null => {
    if (nationalId.length !== 14) return null;
    const centuryDigit = parseInt(nationalId.charAt(0));
    const year = parseInt(nationalId.substring(1, 3));
    const month = parseInt(nationalId.substring(3, 5));
    const day = parseInt(nationalId.substring(5, 7));
    const fullYear = (centuryDigit === 2 ? 1900 : 2000) + year;
    const birthDate = new Date(fullYear, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handlePrintProsecution = () => {
    window.print();
  };

  const handleExportWord = async () => {
    if (!viewingProsecution) return;
    const prosecutionEmployees = employees.filter(e => e.workplace === viewingProsecution.name);

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            children: [
              new TextRun({ text: "هيئة النيابة الإدارية", bold: true, size: 32, rightToLeft: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            children: [
              new TextRun({ text: "إدارة النيابات", bold: true, size: 28, rightToLeft: true }),
            ],
          }),
          new Paragraph({ spacing: { before: 400, after: 400 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            children: [
              new TextRun({ text: `تشكيل موظفي ${viewingProsecution.name}`, bold: true, size: 28, underline: {}, rightToLeft: true }),
            ],
          }),
          new Paragraph({ spacing: { after: 300 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            alignment: AlignmentType.CENTER,
            rows: [
              new TableRow({
                tableHeader: true,
                children: ["م", "الاسم", "الدرجة", "السن", "الرقم القومي"].map(text => 
                  new TableCell({
                    children: [new Paragraph({ 
                      alignment: AlignmentType.CENTER, 
                      bidirectional: true,
                      children: [new TextRun({ bold: true, rightToLeft: true, text: text, size: 36 })] 
                    })],
                    shading: { fill: "F2F2F2" },
                  })
                ),
              }),
              ...prosecutionEmployees.map((emp, index) => 
                new TableRow({
                  children: [
                    String(index + 1),
                    emp.name,
                    emp.grade,
                    String(calculateAge(emp.nationalId) || "--"),
                    emp.nationalId
                  ].map(text => 
                    new TableCell({
                      children: [new Paragraph({ 
                        alignment: AlignmentType.CENTER,
                        bidirectional: true,
                        children: [new TextRun({ text: String(text), rightToLeft: true, size: 36 })]
                      })],
                    })
                  ),
                })
              ),
            ],
          }),
          new Paragraph({ spacing: { before: 1000 } }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `تشكيل_${viewingProsecution.name}.docx`);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    
    if (prosecutions.some(p => p.name === name)) {
      alert('هذه النيابة مسجلة بالفعل');
      return;
    }

    const newProsecution: Prosecution = {
      id: crypto.randomUUID(),
      name
    };

    setProsecutions(prev => [...prev, newProsecution]);
    setNewName('');
    setSearchTerm('');
  };

  const handleDelete = (id: string) => {
    const prosecution = prosecutions.find(p => p.id === id);
    if (!prosecution) return;

    const count = employees.filter(e => e.workplace === prosecution.name).length;
    if (count > 0) {
      alert(`لا يمكن حذف هذه النيابة لأنها مرتبطة بـ ${count} موظف. يرجى نقل الموظفين أولاً.`);
      return;
    }

    if (confirm('هل أنت متأكد من حذف هذه النيابة من القائمة؟')) {
      setProsecutions(prev => prev.filter(p => p.id !== id));
    }
  };

  const processImportData = (data: any[]) => {
    const newPros: Prosecution[] = [];
    
    data.forEach((item) => {
      let name = '';
      if (item['E']) {
        name = String(item['E']).trim();
      } else {
        name = (item['النيابة'] || item['جهة العمل'] || '').toString().trim();
      }
      
      if (name && name !== 'النيابة' && name !== 'الجهة' && name !== 'جهة العمل') {
        if (!prosecutions.some(p => p.name === name) && !newPros.some(p => p.name === name)) {
          newPros.push({
            id: crypto.randomUUID(),
            name
          });
        }
      }
    });

    if (newPros.length > 0) {
      setProsecutions(prev => [...prev, ...newPros]); 
      setSearchTerm('');
      setViewingProsecution(null);
      setShowImportGuide(false);
      setNewName('');
      
      if (onImportSuccess) {
        onImportSuccess();
      }
      
      setTimeout(() => {
        alert(`✅ تم استيراد ${newPros.length} نيابة جديدة بنجاح.`);
      }, 100);
    } else {
      alert('⚠️ لم يتم العثور على أسماء نيابات جديدة.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const dataBuffer = event.target?.result;
        const workbook = XLSX.read(dataBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: "A" });
        processImportData(data);
      } catch (err) {
        alert('حدث خطأ أثناء معالجة الملف.');
      }
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const filtered = prosecutions.filter(p => p.name.includes(searchTerm));
  const prosecutionEmployees = viewingProsecution ? employees.filter(e => e.workplace === viewingProsecution.name) : [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-20">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl shadow-inner">
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">إدارة النيابات</h3>
              <p className="text-sm text-slate-500">تحديث الهيكل التنظيمي</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setShowImportGuide(!showImportGuide)}
              className={`p-3 rounded-xl border transition-all ${showImportGuide ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
            >
              <Info size={20} />
            </button>
            <label className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl cursor-pointer hover:bg-emerald-700 transition-all shadow-lg">
              <FileSpreadsheet size={20} />
              <span>استيراد من العمود E</span>
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        {showImportGuide && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 animate-fadeIn">
            <h4 className="font-bold text-sm text-amber-800 mb-2">تعليمات الاستيراد:</h4>
            <p className="text-xs text-amber-900/70">يجب أن تكون أسماء النيابات في العمود الخامس (E) من ملف الإكسل.</p>
          </div>
        )}

        <form onSubmit={handleAdd} className="flex gap-4 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex-1 relative">
            <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              required
              placeholder="إضافة اسم نيابة جديد..."
              className="w-full pr-12 pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg transition-all active:scale-95">إضافة يدوية</button>
        </form>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="font-bold text-slate-700">النيابات المسجلة ({prosecutions.length})</h4>
            <div className="relative w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="بحث..." 
                className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((prosecution) => {
              const empCount = employees.filter(e => e.workplace === prosecution.name).length;
              return (
                <div key={prosecution.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-300 transition-all group shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block">{prosecution.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">عدد الموظفين: {empCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setViewingProsecution(prosecution)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition-all"
                    >
                      استعراض
                    </button>
                    <button type="button" onClick={() => handleDelete(prosecution.id)} className="p-2 text-red-300 hover:text-red-600 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {viewingProsecution && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn print:static print:bg-white print:p-0 print:block" dir="rtl">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-scaleIn print:shadow-none print:max-h-none print:w-full print:rounded-none">
            <div className="bg-blue-900 px-8 py-6 flex items-center justify-between text-white print:bg-white print:text-black print:border-b-4 print:border-black print:px-0">
              <div className="print:text-center print:w-full text-right">
                <h3 className="text-xl font-bold">تشكيل موظفي {viewingProsecution.name}</h3>
                <p className="text-sm opacity-80 mt-1 print:text-xs">إجمالي عدد الموظفين: {prosecutionEmployees.length}</p>
              </div>
              <button type="button" onClick={() => setViewingProsecution(null)} className="hover:bg-white/10 p-2 rounded-full text-white print:hidden"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 print:bg-white print:p-0 text-right">
              <table className="w-full text-right bg-white rounded-xl overflow-hidden shadow-sm border-collapse print:border print:border-black print:rounded-none" dir="rtl">
                <thead className="bg-slate-50 border-b print:bg-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 border print:border-black text-center">م</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 border print:border-black text-right">الاسم</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 border print:border-black text-right">الدرجة</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 text-center border print:border-black">السن</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 border print:border-black text-right">الرقم القومي</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {prosecutionEmployees.map((emp, index) => (
                    <tr key={emp.id} className="hover:bg-blue-50/40">
                      <td className="px-6 py-4 text-xs border print:border-black text-center">{index + 1}</td>
                      <td className="px-6 py-4 border print:border-black text-right">
                        <span className="font-bold text-slate-700 text-sm block">{emp.name}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 border print:border-black text-right">{emp.grade}</td>
                      <td className="px-6 py-4 text-center text-xs font-bold border print:border-black">{calculateAge(emp.nationalId)} سنه</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs border print:border-black text-right">{emp.nationalId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 bg-white border-t flex justify-end gap-3 print:hidden">
              <button 
                type="button" 
                onClick={handleExportWord}
                className="px-4 py-3 bg-blue-600 text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md"
              >
                <FileText size={20} /> تصدير Word
              </button>
              <button 
                type="button" 
                onClick={handlePrintProsecution} 
                className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md"
              >
                <Printer size={20} /> طباعة التشكيل
              </button>
              <button type="button" onClick={() => setViewingProsecution(null)} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProsecutionManagement;