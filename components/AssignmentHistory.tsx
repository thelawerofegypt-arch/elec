
import React, { useState } from 'react';
import { History, Calendar, Users, MapPin, Search, Filter, X, Printer, Flag, CircleDot, FileText, Edit3, AlertCircle, ArrowLeftCircle } from 'lucide-react';
import { Assignment, Employee } from '../types';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, AlignmentType, TextRun, WidthType, BorderStyle } from 'docx';
import saveAs from 'file-saver';

interface Props {
  assignments: Assignment[];
  employees: Employee[];
  onEdit: (asg: Assignment) => void;
}

const AssignmentHistory: React.FC<Props> = ({ assignments, employees, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('الكل');
  const [printingAssignment, setPrintingAssignment] = useState<Assignment | null>(null);

  const filteredAssignments = assignments.filter(asg => {
    const matchesSearch = asg.entityName.includes(searchTerm);
    const matchesDate = dateFilter ? asg.date === dateFilter : true;
    const matchesType = typeFilter === 'الكل' ? true : asg.entityType === typeFilter;
    return matchesSearch && matchesDate && matchesType;
  }).reverse();

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setTypeFilter('الكل');
  };

  const getEmployeeData = (employeeId: string) => {
    let emp = employees.find(e => e.id === employeeId);
    const mobileNumber = (emp?.phone && emp.phone.toString().trim() !== "") 
      ? emp.phone.toString().trim() 
      : "غير مسجل";

    return {
      name: emp?.name || "اسم غير معروف",
      workplace: emp?.workplace || "غير محدد",
      phone: mobileNumber,
      grade: emp?.grade || "غير محدد"
    };
  };

  const handlePrint = (asg: Assignment) => {
    if (asg.isDraft) return;
    setPrintingAssignment(asg);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleExportWord = async (asg: Assignment) => {
    if (asg.isDraft) return;
    
    const docChildren: any[] = [
      new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ text: "هيئة النيابة الإدارية", bold: true, size: 32, rightToLeft: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ text: "إدارة النيابات", bold: true, size: 28, rightToLeft: true })] }),
      new Paragraph({ spacing: { before: 400, after: 400 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ text: "كشف المكلفين بالعملية الانتخابية", bold: true, size: 28, underline: {}, rightToLeft: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ text: `جهة الانتداب: ${asg.entityName}`, bold: true, size: 24, rightToLeft: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ text: `تاريخ الندب: ${new Date(asg.date).toLocaleDateString('ar-EG')}`, bold: true, size: 20, rightToLeft: true })] }),
      new Paragraph({ spacing: { after: 300 } }),
    ];

    const addSection = (title: string, roleData: any[], columns: string[], location: string, notes: string) => {
      if (roleData.length === 0) return;
      
      docChildren.push(new Paragraph({ 
        alignment: AlignmentType.CENTER, 
        bidirectional: true, 
        children: [new TextRun({ text: title, bold: true, size: 36, color: "000000", rightToLeft: true })], 
        spacing: { before: 200, after: 100 } 
      }));

      const rows = roleData.map((r, i) => {
        const empDetails = getEmployeeData(r.employeeId);
        let roleName = title;
        if (r.roleType === 'فرعية') roleName = `فرعية (${r.subCommitteeNumber})`;
        
        return new TableRow({ 
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ text: String(i + 1), rightToLeft: true, size: 36 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ text: empDetails.name, rightToLeft: true, size: 36 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ text: roleName, rightToLeft: true, size: 36 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ text: empDetails.workplace, rightToLeft: true, size: 36 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ text: empDetails.phone, rightToLeft: true, size: 36 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ text: location || "-", rightToLeft: true, size: 36 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ text: notes || "-", rightToLeft: true, size: 36 })] })] }),
          ]
        });
      });

      docChildren.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          new TableRow({ 
            tableHeader: true, 
            children: columns.map(text => new TableCell({ 
              children: [new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ bold: true, rightToLeft: true, text: text, size: 36 })] })], 
              shading: { fill: "F2F2F2" } 
            })) 
          }),
          ...rows
        ],
      }));
    };

    const superior = asg.roles?.filter(r => r.roleType === 'عليا') || [];
    const general = asg.roles?.filter(r => r.roleType === 'عامة') || [];
    const sub = asg.roles?.filter(r => r.roleType === 'فرعية').sort((a,b) => (a.subCommitteeNumber || 0) - (b.subCommitteeNumber || 0)) || [];

    const tableHeaders = ["م", "الاسم", "اللجنة", "الجهة", "الموبايل", "المقر", "ملاحظات"];

    addSection("اللجنة العليا", superior, tableHeaders, asg.superiorLocation || '', asg.superiorNotes || '');
    addSection("اللجنة العامة", general, tableHeaders, asg.generalLocation || '', asg.generalNotes || '');
    addSection("اللجان الفرعية", sub, tableHeaders, asg.subLocation || '', asg.subNotes || '');

    const doc = new Document({ sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children: docChildren }] });
    saveAs(await Packer.toBlob(doc), `كشف_انتداب_${asg.entityName}.docx`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-4 rounded-2xl shadow-sm border flex flex-wrap gap-4 items-end print:hidden">
        <div className="flex-1 min-w-[200px] space-y-1">
          <label className="text-xs font-bold text-slate-500 mr-1">بحث بجهة الانتداب</label>
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="مثلاً: نقابة المهندسين..." className="w-full pr-10 pl-4 py-2 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="w-48 space-y-1">
          <label className="text-xs font-bold text-slate-500 mr-1">تصفية بالتاريخ</label>
          <input type="date" className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm outline-none" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
        {(searchTerm || dateFilter) && <button onClick={clearFilters} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><X size={20} /></button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
        {filteredAssignments.map(assignment => (
          <div key={assignment.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow group ${assignment.isDraft ? 'border-amber-300 bg-amber-50/20 border-dashed' : 'border-slate-200'}`}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  {assignment.isDraft ? (
                    <span className="px-3 py-1 rounded-lg text-[11px] font-black mb-2 inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200">
                      <AlertCircle size={12} /> مشروع مسودة
                    </span>
                  ) : (
                    <span className={`px-2 py-1 rounded text-[10px] font-bold mb-2 inline-block ${assignment.entityType === 'نقابة' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                      {assignment.entityType}
                    </span>
                  )}
                  <h4 className="text-xl font-bold text-slate-800">{assignment.entityName || 'بدون اسم'}</h4>
                </div>
                <div className="text-left flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                    <Calendar size={16} />
                    {assignment.date}
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => onEdit(assignment)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="تعديل"><Edit3 size={16} /></button>
                     {!assignment.isDraft && (
                       <>
                         <button onClick={() => handleExportWord(assignment)} className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="تصدير وورد"><FileText size={16} /></button>
                         <button onClick={() => handlePrint(assignment)} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Printer size={16} /></button>
                       </>
                     )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {printingAssignment && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col p-0 overflow-y-auto hidden print:block text-[14pt]" dir="rtl">
          <div className="p-10 space-y-8 text-right">
            <div className="text-center border-b-4 border-black pb-6">
              <h1 className="text-3xl font-bold mb-2">هيئة النيابة الإدارية</h1>
              <h2 className="text-xl font-bold">كشف المكلفين بالعملية الانتخابية</h2>
              <div className="flex justify-between mt-6 font-bold">
                <p>الجهة: {printingAssignment.entityName}</p>
                <p>التاريخ: {printingAssignment.date}</p>
              </div>
            </div>
            {['عليا', 'عامة', 'فرعية'].map(type => {
              const roles = printingAssignment.roles?.filter(r => r.roleType === type) || [];
              if (roles.length === 0) return null;
              
              const groupLoc = type === 'عليا' ? printingAssignment.superiorLocation : type === 'عامة' ? printingAssignment.generalLocation : printingAssignment.subLocation;
              const groupNote = type === 'عليا' ? printingAssignment.superiorNotes : type === 'عامة' ? printingAssignment.generalNotes : printingAssignment.subNotes;

              return (
                <section key={type} className="space-y-4">
                  <h3 className="text-[16pt] font-bold text-center mb-4">
                    {type === 'عليا' ? 'اللجنة العليا' : type === 'عامة' ? 'اللجنة العامة' : 'اللجان الفرعية'}
                  </h3>
                  <table className="w-full border-collapse border border-black text-[14pt]" dir="rtl">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-2 w-12 text-center">م</th>
                        <th className="border border-black p-2 text-right">الاسم</th>
                        <th className="border border-black p-2 text-right">اللجنة</th>
                        <th className="border border-black p-2 text-right">الجهة الأصلية</th>
                        <th className="border border-black p-2 text-right">المقر الانتخابي</th>
                        <th className="border border-black p-2 text-right">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((r, i) => { 
                        const details = getEmployeeData(r.employeeId);
                        return (
                          <tr key={i}>
                            <td className="border border-black p-2 text-center">{i + 1}</td>
                            <td className="border border-black p-2 font-bold">{details.name}</td>
                            <td className="border border-black p-2 text-center">
                              {type === 'فرعية' ? `فرعية ${r.subCommitteeNumber}` : type === 'عليا' ? 'عليا' : 'عامة'}
                            </td>
                            <td className="border border-black p-2">{details.workplace}</td>
                            <td className="border border-black p-2">{groupLoc || "-"}</td>
                            <td className="border border-black p-2">{groupNote || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>
              )
            })}
          </div>
          <button type="button" onClick={() => setPrintingAssignment(null)} className="fixed bottom-10 left-10 p-4 bg-red-600 text-white rounded-full print:hidden">
            <X size={32} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AssignmentHistory;
