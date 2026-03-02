
import React, { useState } from 'react';
import { Download, FileText, Printer, FileSpreadsheet, ShieldCheck, RefreshCw } from 'lucide-react';
import { Employee, Assignment } from '../types';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, AlignmentType, TextRun, WidthType, BorderStyle } from 'docx';
import saveAs from 'file-saver';

interface Props {
  employees: Employee[];
  assignments: Assignment[];
}

const Reports: React.FC<Props> = ({ employees, assignments }) => {
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handlePrintReport = () => {
    window.print();
  };

  const exportAllToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Employees Sheet
    const empData = employees.map(e => ({
      'مسلسل': e.serialNumber,
      'الاسم': e.name,
      'الدرجة': e.grade,
      'الجهة': e.workplace,
      'العنوان': e.address,
      'رقم الموبايل': e.phone,
      'الرقم القومي': e.nationalId,
      'الحالة': e.isActive ? 'نشط' : 'غير نشط',
      'السن': calculateAge(e.nationalId),
      'عدد المشاركات': e.assignmentCount || 0,
      'تاريخ آخر مشاركة': e.lastAssignmentDate || ''
    }));
    const empSheet = XLSX.utils.json_to_sheet(empData);
    XLSX.utils.book_append_sheet(workbook, empSheet, "كشف الموظفين");

    // Assignments Sheet
    const asgData = assignments.map(a => ({
      'التاريخ': a.date,
      'جهة الانتداب': a.entityName,
      'النوع': a.entityType,
      'عدد الموظفين': a.employeeIds.length
    }));
    const asgSheet = XLSX.utils.json_to_sheet(asgData);
    XLSX.utils.book_append_sheet(workbook, asgSheet, "سجل الانتدابات");

    XLSX.writeFile(workbook, `قاعدة_بيانات_الانتدابات_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
  };

  const handleExportWord = async () => {
    setIsProcessing(true);
    try {
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
                new TextRun({ text: "كشف بيان موظفي النيابة الإدارية", bold: true, size: 28, underline: {}, rightToLeft: true }),
              ],
            }),
            new Paragraph({ spacing: { after: 300 } }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              alignment: AlignmentType.CENTER,
              rows: [
                new TableRow({
                  tableHeader: true,
                  children: [
                    "مسلسل", "الاسم", "الرقم القومي", "النوع", "الجهة", "الدرجة", "رقم الموبايل", "العنوان", "الحالة", "ملاحظات"
                  ].map(text => 
                    new TableCell({
                      children: [new Paragraph({ 
                        alignment: AlignmentType.CENTER, 
                        bidirectional: true,
                        children: [new TextRun({ bold: true, rightToLeft: true, text: text, size: 20 })] 
                      })],
                      shading: { fill: "F2F2F2" },
                    })
                  ),
                }),
                ...employees.map((e, index) => 
                  new TableRow({
                    children: [
                      String(e.serialNumber || index + 1),
                      e.name,
                      e.nationalId,
                      e.gender,
                      e.workplace,
                      e.grade,
                      e.phone || "",
                      e.address || "",
                      e.isActive ? "نشط" : "مستبعد",
                      e.notes || ""
                    ].map(text => 
                      new TableCell({
                        children: [new Paragraph({ 
                          alignment: AlignmentType.CENTER,
                          bidirectional: true,
                          children: [new TextRun({ text: String(text), rightToLeft: true, size: 18 })]
                        })],
                      })
                    ),
                  })
                ),
              ],
            }),
            new Paragraph({ 
              spacing: { before: 600 },
              alignment: AlignmentType.LEFT,
              bidirectional: true,
              children: [
                new TextRun({ text: `تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}`, size: 16, rightToLeft: true, italics: true })
              ]
            })
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Employees_${new Date().toISOString().split('T')[0]}.docx`);
    } catch (error) {
      console.error("Word Export Error:", error);
      alert("حدث خطأ أثناء تصدير ملف Word.");
    } finally {
      setIsProcessing(false);
    }
  };

  const neverAssigned = employees.filter(e => e.assignmentCount === 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 print:hidden text-right" dir="rtl">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3 justify-end">
          مركز التقارير والطباعة
          <FileText size={28} className="text-emerald-600" />
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center text-center">
             <div className="p-4 bg-white rounded-full mb-4 shadow-sm text-emerald-600">
               <Printer size={32} />
             </div>
             <h4 className="font-bold text-emerald-900 mb-2">الطباعة الرسمية</h4>
             <p className="text-xs text-emerald-700 mb-6">طباعة كشوف الموظفين أو الانتدابات بتنسيق رسمي مع شعار الهيئة.</p>
             <button onClick={handlePrintReport} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md">بدء الطباعة</button>
          </div>

          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center text-center">
             <div className="p-4 bg-white rounded-full mb-4 shadow-sm text-blue-600">
               <FileSpreadsheet size={32} />
             </div>
             <h4 className="font-bold text-blue-900 mb-2">تصدير إكسل (XLSX)</h4>
             <p className="text-xs text-blue-700 mb-6">استخراج قاعدة البيانات كاملة في ملف إكسل واحد بتبويبات مختلفة.</p>
             <button onClick={exportAllToExcel} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md">تصدير Excel</button>
          </div>

          <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center text-center">
             <div className="p-4 bg-white rounded-full mb-4 shadow-sm text-indigo-600">
               <FileText size={32} />
             </div>
             <h4 className="font-bold text-indigo-900 mb-2">تصدير Word (DOCX)</h4>
             <p className="text-xs text-indigo-700 mb-6">تصدير كشف الموظفين بجدول RTL منسق يدعم التحرير في Microsoft Word.</p>
             <button 
              onClick={handleExportWord} 
              disabled={isProcessing}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md flex items-center justify-center gap-2"
             >
               {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
               تصدير Word
             </button>
          </div>

          <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col items-center text-center">
             <div className="p-4 bg-white rounded-full mb-4 shadow-sm text-amber-600">
               <ShieldCheck size={32} />
             </div>
             <h4 className="font-bold text-amber-900 mb-2">تقرير العدالة</h4>
             <p className="text-xs text-amber-700 mb-6">عرض الموظفين الذين لم يشاركوا نهائياً لإعطائهم الأولوية.</p>
             <div className="text-2xl font-black text-amber-700 mb-4">{neverAssigned.length} موظف</div>
          </div>
        </div>
      </div>

      <div className="hidden print:block bg-white text-right" dir="rtl">
          <div className="text-center p-8 border-b-4 border-emerald-900 mb-8">
            <h1 className="text-4xl font-bold text-emerald-900 mb-2">هيئة النيابة الإدارية</h1>
            <h2 className="text-2xl font-bold text-slate-700">تقرير الموقف الإحصائي والمشاركات</h2>
            <div className="flex justify-between mt-8 text-sm font-bold text-slate-500">
               <span>إجمالي القوى البشرية: {employees.length}</span>
               <span>إجمالي الفعاليات المنفذة: {assignments.length}</span>
               <span>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</span>
            </div>
          </div>

          <div className="space-y-8">
             <section>
                <h3 className="text-lg font-bold border-r-4 border-emerald-600 pr-3 mb-4">أحدث 10 فعاليات انتداب</h3>
                <table className="w-full border-collapse" dir="rtl">
                   <thead>
                      <tr className="bg-slate-100">
                         <th className="border p-2 text-right">التاريخ</th>
                         <th className="border p-2 text-right">جهة الانتداب</th>
                         <th className="border p-2 text-right">النوع</th>
                         <th className="border p-2 text-center">عدد المشاركين</th>
                      </tr>
                   </thead>
                   <tbody>
                      {assignments.slice(-10).reverse().map(a => (
                        <tr key={a.id}>
                           <td className="border p-2 text-sm">{a.date}</td>
                           <td className="border p-2 text-sm font-bold">{a.entityName}</td>
                           <td className="border p-2 text-sm">{a.entityType}</td>
                           <td className="border p-2 text-sm text-center font-bold">{a.employeeIds.length}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </section>
          </div>
      </div>
    </div>
  );
};

export default Reports;
