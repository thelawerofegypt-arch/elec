
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2,
  GanttChartSquare,
  Layers,
  Search,
  Scale,
  UserPlus,
  X,
  User,
  Building2,
  AlertCircle,
  Filter,
  ArrowUpDown,
  Hash,
  CheckSquare,
  Square,
  Save,
  ChevronRight,
  Calendar,
  MapPin,
  MessageSquare,
  Phone,
  Briefcase
} from 'lucide-react';
import { Employee, Assignment, EmployeeRole, Prosecution } from '../types';
import { db } from '../utils/db';

interface Props {
  employees: Employee[];
  onComplete: () => void;
  prosecutions: Prosecution[];
  editAssignment?: Assignment | null;
}

const AssignmentCreator: React.FC<Props> = ({ employees, onComplete, prosecutions, editAssignment }) => {
  const [step, setStep] = useState(1);
  const [entityName, setEntityName] = useState('');
  const [entityType, setEntityType] = useState<'نقابة' | 'نادي' | 'أخرى'>('نقابة');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [requiredCount, setRequiredCount] = useState(0);
  
  // Group fields
  const [superiorLocation, setSuperiorLocation] = useState('');
  const [superiorNotes, setSuperiorNotes] = useState('');
  const [generalLocation, setGeneralLocation] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [subLocation, setSubLocation] = useState('');
  const [subNotes, setSubNotes] = useState('');

  const [distribution, setDistribution] = useState({
    superiorCount: 0,
    generalCount: 0,
    subCommitteeMemberCount: 1,
    subCommitteeTotalCount: 0
  });

  const [selectedRoles, setSelectedRoles] = useState<EmployeeRole[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ title: string; type: string; subNum?: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [prosecutionFilter, setProsecutionFilter] = useState<string>('الكل');
  const [prosecutionSearch, setProsecutionSearch] = useState(''); 
  const [participationSort, setParticipationSort] = useState<'asc' | 'desc'>('asc');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);

  // تحميل البيانات عند التعديل
  useEffect(() => {
    if (editAssignment) {
      setEntityName(editAssignment.entityName);
      setEntityType(editAssignment.entityType);
      setDate(editAssignment.date);
      setSelectedRoles(editAssignment.roles || []);
      
      setSuperiorLocation(editAssignment.superiorLocation || '');
      setSuperiorNotes(editAssignment.superiorNotes || '');
      setGeneralLocation(editAssignment.generalLocation || '');
      setGeneralNotes(editAssignment.generalNotes || '');
      setSubLocation(editAssignment.subLocation || '');
      setSubNotes(editAssignment.subNotes || '');

      const superior = editAssignment.roles?.filter(r => r.roleType === 'عليا').length || 0;
      const general = editAssignment.roles?.filter(r => r.roleType === 'عامة').length || 0;
      const subRoles = editAssignment.roles?.filter(r => r.roleType === 'فرعية') || [];
      const subTotal = Math.max(...subRoles.map(r => r.subCommitteeNumber || 0), 0);
      const subMember = subTotal > 0 ? (subRoles.length / subTotal) : 1;

      setDistribution({
        superiorCount: superior,
        generalCount: general,
        subCommitteeTotalCount: subTotal,
        subCommitteeMemberCount: Math.ceil(subMember)
      });
      setRequiredCount(editAssignment.roles?.length || 0);
    }
  }, [editAssignment]);

  const totalAllocated = useMemo(() => {
    return (
      Number(distribution.superiorCount) +
      Number(distribution.generalCount) +
      (Number(distribution.subCommitteeMemberCount) * Number(distribution.subCommitteeTotalCount))
    );
  }, [distribution]);

  const allSlots = useMemo(() => {
    const slots = [];
    for (let i = 0; i < distribution.superiorCount; i++) {
      slots.push({ title: `اللجنة العليا - عضو ${i+1}`, type: 'عليا' });
    }
    for (let i = 0; i < distribution.generalCount; i++) {
      slots.push({ title: `اللجنة العامة - عضو ${i+1}`, type: 'عامة' });
    }
    for (let s = 1; s <= distribution.subCommitteeTotalCount; s++) {
      for (let m = 1; m <= distribution.subCommitteeMemberCount; m++) {
        slots.push({ title: `اللجنة الفرعية (${s}) - عضو ${m}`, type: 'فرعية', subNum: s });
      }
    }
    return slots;
  }, [distribution]);

  const isCountMatched = totalAllocated === requiredCount && requiredCount > 0;

  const availableEmployees = useMemo(() => {
    let filtered = employees.filter(e => 
      e.isActive && 
      (searchTerm === '' || e.name.includes(searchTerm) || e.nationalId.includes(searchTerm))
    );

    if (prosecutionFilter !== 'الكل') {
      filtered = filtered.filter(e => e.workplace === prosecutionFilter);
    }

    filtered.sort((a, b) => {
      const countA = a.assignmentCount || 0;
      const countB = b.assignmentCount || 0;
      return participationSort === 'asc' ? countA - countB : countB - countA;
    });

    return filtered;
  }, [employees, searchTerm, prosecutionFilter, participationSort]);

  const handleSelectEmployee = (emp: Employee) => {
    if (!activeSlot) return;

    if (isMultiSelectMode) {
      setTempSelectedIds(prev => 
        prev.includes(emp.id) ? prev.filter(id => id !== emp.id) : [...prev, emp.id]
      );
      return;
    }

    const newRoles = selectedRoles.filter(r => r.employeeId !== emp.id);
    newRoles.push({
      employeeId: emp.id,
      roleType: activeSlot.type as any,
      subCommitteeNumber: activeSlot.subNum
    });

    setSelectedRoles(newRoles);
    setIsSelectorOpen(false);
    setActiveSlot(null);
    setSearchTerm('');
  };

  const handleConfirmMultiSelect = () => {
    if (!activeSlot || tempSelectedIds.length === 0) return;
    
    let newRoles = [...selectedRoles];
    let pointer = 0;

    for (const slot of allSlots) {
      if (pointer >= tempSelectedIds.length) break;
      if (slot.type !== activeSlot.type) continue;

      const assignedInSlot = newRoles.some(r => r.roleType === slot.type && r.subCommitteeNumber === slot.subNum && r.employeeId === tempSelectedIds[pointer]);
      // This logic needs to be careful to fill empty slots of the same type
      const currentSlotAssigned = newRoles.filter(r => r.roleType === slot.type && r.subCommitteeNumber === slot.subNum).length;
      const occurrences = allSlots.filter(s => s.type === slot.type && s.subNum === slot.subNum).length;

      if (currentSlotAssigned < occurrences) {
        const empId = tempSelectedIds[pointer];
        if (!newRoles.some(r => r.employeeId === empId)) {
          newRoles.push({
            employeeId: empId,
            roleType: slot.type as any,
            subCommitteeNumber: slot.subNum
          });
          pointer++;
        } else {
          pointer++;
        }
      }
    }

    setSelectedRoles(newRoles);
    setIsSelectorOpen(false);
    setTempSelectedIds([]);
    setIsMultiSelectMode(false);
    setSearchTerm('');
  };

  const handleSaveDraft = async () => {
    const assignment: Assignment = { 
      id: editAssignment?.id || crypto.randomUUID(), 
      date, 
      entityName, 
      entityType, 
      employeeIds: selectedRoles.map(r => r.employeeId),
      roles: selectedRoles,
      isDraft: true,
      superiorLocation, superiorNotes,
      generalLocation, generalNotes,
      subLocation, subNotes
    };

    if (editAssignment) {
      await db.assignments.put(assignment);
    } else {
      await db.assignments.add(assignment);
    }
    onComplete();
  };

  const handleFinalize = async () => {
    const newAssignment: Assignment = { 
      id: editAssignment?.id || crypto.randomUUID(), 
      date, 
      entityName, 
      entityType, 
      employeeIds: selectedRoles.map(r => r.employeeId),
      roles: selectedRoles,
      isDraft: false,
      superiorLocation, superiorNotes,
      generalLocation, generalNotes,
      subLocation, subNotes
    };

    await (db as any).transaction('rw', [db.assignments, db.employees], async () => {
      if (editAssignment) {
        for (const oldId of editAssignment.employeeIds) {
          const emp = await db.employees.get(oldId);
          if (emp) await db.employees.update(oldId, { assignmentCount: Math.max(0, (emp.assignmentCount || 0) - 1) });
        }
        await db.assignments.put(newAssignment);
      } else {
        await db.assignments.add(newAssignment);
      }

      for (const role of selectedRoles) {
        const emp = await db.employees.get(role.employeeId);
        if (emp) {
          await db.employees.update(role.employeeId, {
            assignmentCount: (emp.assignmentCount || 0) + 1,
            lastAssignmentDate: date
          });
        }
      }
    });

    onComplete();
  };

  const renderSlot = (slot: any, idx: number) => {
    const roleMatches = selectedRoles.filter(r => r.roleType === slot.type && r.subCommitteeNumber === slot.subNum);
    // Find which slot index this is relative to its type/subNum group
    const slotsOfThisType = allSlots.filter(s => s.type === slot.type && s.subNum === slot.subNum);
    const slotIndexInGroup = allSlots.indexOf(slot) - allSlots.findIndex(s => s.type === slot.type && s.subNum === slot.subNum);
    const currentRole = roleMatches[slotIndexInGroup];
    const emp = currentRole ? employees.find(e => e.id === currentRole.employeeId) : null;

    return (
      <div key={idx} className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${emp ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 border-dashed hover:border-blue-400 cursor-pointer shadow-sm'}`}
           onClick={() => !emp && (setActiveSlot(slot), setIsSelectorOpen(true))}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${emp ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {idx + 1}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{slot.title}</p>
              <p className={`text-sm font-bold ${emp ? 'text-emerald-900' : 'text-slate-300 italic'}`}>
                {emp ? emp.name : 'اضغط للتعيين يدوياً...'}
              </p>
            </div>
          </div>
          {emp && (
            <button onClick={(e) => { e.stopPropagation(); setSelectedRoles(prev => prev.filter(r => r.employeeId !== emp.id)); }} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg">
              <X size={16} />
            </button>
          )}
        </div>
        
        {emp && (
          <div className="grid grid-cols-1 gap-1 text-[10px] font-bold border-t border-emerald-100 pt-2 text-slate-600">
            <div className="flex items-center gap-1"><Building2 size={10} className="text-emerald-600" /> {emp.workplace}</div>
            <div className="flex items-center gap-1"><Briefcase size={10} className="text-emerald-600" /> {emp.grade}</div>
            <div className="flex items-center gap-1"><MapPin size={10} className="text-emerald-600" /> {emp.address || 'غير مسجل'}</div>
            <div className="flex items-center gap-1"><Phone size={10} className="text-emerald-600" /> {emp.phone || 'غير مسجل'}</div>
          </div>
        )}
      </div>
    );
  };

  const renderGroupSection = (type: string, title: string, location: string, setLocation: any, notes: string, setNotes: any) => {
    const groupSlots = allSlots.filter(s => s.type === type);
    if (groupSlots.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="bg-slate-100/50 p-6 rounded-3xl border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <Layers size={20} className="text-emerald-600" /> {title}
            </h4>
            <div className="flex flex-wrap gap-4 flex-1 justify-end">
              <div className="relative flex-1 max-w-[300px]">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="المقر الانتخابي للفئة..." 
                  className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="relative flex-1 max-w-[300px]">
                <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="ملاحظات إضافية..." 
                  className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupSlots.map((slot) => renderSlot(slot, allSlots.indexOf(slot)))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-20 text-right" dir="rtl">
      <div className="flex justify-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md transition-all ${step >= s ? 'bg-emerald-600 text-white scale-110' : 'bg-slate-200 text-slate-500'}`}>{s}</div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8">
          <div className="flex items-center gap-3 border-b pb-4">
            <GanttChartSquare className="text-emerald-600" size={28} />
            <h3 className="text-2xl font-bold text-emerald-900">تخطيط هيكل الانتداب</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 mr-2">جهة الانتداب</label>
              <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="مثال: انتخابات نقابة المهندسين" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 mr-2 flex items-center gap-1">
                <Calendar size={14} /> تاريخ الندب
              </label>
              <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 mr-2">إجمالي العدد المطلوب</label>
              <input type="number" className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-center font-black text-xl" value={requiredCount} onChange={(e) => setRequiredCount(parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-700 flex items-center gap-2"><Layers size={18} /> توزيع اللجان:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border">
                <label className="text-[10px] font-bold block mb-1">اللجنة العليا</label>
                <input type="number" className="w-full p-2 border rounded-lg text-center" value={distribution.superiorCount} onChange={e => setDistribution({...distribution, superiorCount: parseInt(e.target.value) || 0})} />
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border">
                <label className="text-[10px] font-bold block mb-1">اللجنة العامة</label>
                <input type="number" className="w-full p-2 border rounded-lg text-center" value={distribution.generalCount} onChange={e => setDistribution({...distribution, generalCount: parseInt(e.target.value) || 0})} />
              </div>
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 col-span-2">
                <div className="flex gap-4">
                   <div className="flex-1">
                      <label className="text-[10px] font-bold block mb-1">عدد اللجان الفرعية</label>
                      <input type="number" className="w-full p-2 border rounded-lg text-center font-bold" value={distribution.subCommitteeTotalCount} onChange={e => setDistribution({...distribution, subCommitteeTotalCount: parseInt(e.target.value) || 0})} />
                   </div>
                   <div className="flex-1">
                      <label className="text-[10px] font-bold block mb-1">عدد الموظفين لكل فرعية</label>
                      <input type="number" className="w-full p-2 border rounded-lg text-center font-bold" value={distribution.subCommitteeMemberCount} onChange={e => setDistribution({...distribution, subCommitteeMemberCount: parseInt(e.target.value) || 0})} />
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl flex items-center gap-3 border ${isCountMatched ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <Scale size={20} />
            <p className="font-bold text-sm">إجمالي الخانات المخططة: {totalAllocated} من أصل {requiredCount}</p>
          </div>

          <button disabled={!isCountMatched || !entityName} onClick={() => setStep(2)} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
            بدء تسكين الموظفين <ChevronRight size={20} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-wrap justify-between items-center sticky top-20 z-10 gap-4">
             <div>
               <h4 className="font-black text-slate-800">تسكين الموظفين باللجان</h4>
               <p className="text-xs text-slate-500">تم تسكين {selectedRoles.length} من {totalAllocated} خانة.</p>
             </div>
             <div className="flex flex-wrap gap-2">
               <button onClick={handleSaveDraft} className="px-6 py-3 bg-amber-100 text-amber-700 font-bold rounded-xl hover:bg-amber-200 flex items-center gap-2">
                 <Save size={18} /> حفظ وإغلاق كمسودة
               </button>
               <button onClick={() => setStep(1)} className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">رجوع</button>
               <button disabled={selectedRoles.length === 0} onClick={() => setStep(3)} className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl disabled:opacity-50 shadow-md">المعاينة النهائية</button>
             </div>
           </div>
           
           <div className="space-y-8">
             {renderGroupSection('عليا', 'اللجنة العليا', superiorLocation, setSuperiorLocation, superiorNotes, setSuperiorNotes)}
             {renderGroupSection('عامة', 'اللجنة العامة', generalLocation, setGeneralLocation, generalNotes, setGeneralNotes)}
             {renderGroupSection('فرعية', 'اللجان الفرعية', subLocation, setSubLocation, subNotes, setSubNotes)}
           </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white p-10 rounded-3xl shadow-xl border text-center space-y-6">
          <CheckCircle2 size={64} className="text-emerald-600 mx-auto" />
          <h3 className="text-2xl font-bold">تأكيد اعتماد الانتداب</h3>
          <p className="text-slate-500">جهة الانتداب: <span className="text-slate-800 font-bold">{entityName}</span> | التاريخ: <span className="font-bold">{date}</span></p>
          {selectedRoles.length < totalAllocated && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 font-bold text-sm">
              تنبيه: لم يتم استكمال تسكين كافة الخانات ({selectedRoles.length} من {totalAllocated}). سيتم حفظه كمسودة إذا اعتمدت الآن.
            </div>
          )}
          <div className="flex gap-4">
            <button onClick={handleFinalize} className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl text-xl shadow-lg hover:bg-emerald-700 active:scale-95">اعتماد الانتداب نهائياً</button>
            <button onClick={() => setStep(2)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold">متابعة التسكين</button>
          </div>
        </div>
      )}

      {isSelectorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">اختيار موظفين لـ {activeSlot?.title}</h3>
              </div>
              <button onClick={() => { setIsSelectorOpen(false); setTempSelectedIds([]); setIsMultiSelectMode(false); }} className="p-2 rounded-full hover:bg-white/10"><X size={24} /></button>
            </div>
            
            <div className="p-6 bg-slate-50 border-b space-y-4">
               <div className="flex flex-wrap items-center justify-between gap-4">
                 <div className="relative flex-1 min-w-[300px]">
                   <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input autoFocus type="text" placeholder="بحث بالاسم أو الرقم القومي..." className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                 </div>
                 
                 <button 
                  onClick={() => { setIsMultiSelectMode(!isMultiSelectMode); setTempSelectedIds([]); }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold border transition-all ${isMultiSelectMode ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                 >
                   {isMultiSelectMode ? <CheckSquare size={18} /> : <Square size={18} />} اختيار متعدد
                 </button>
               </div>

               <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[250px] space-y-2">
                    <div className="relative">
                      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="ابحث عن نيابة..." className="w-full pr-9 pl-3 py-2 border rounded-xl text-xs" value={prosecutionSearch} onChange={e => setProsecutionSearch(e.target.value)} />
                    </div>
                    <select className="w-full pr-4 py-2 bg-white border rounded-xl text-xs font-bold" value={prosecutionFilter} onChange={e => setProsecutionFilter(e.target.value)}>
                      <option value="الكل">كل النيابات</option>
                      {prosecutions.filter(p => p.name.includes(prosecutionSearch)).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <button onClick={() => setParticipationSort(prev => prev === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold h-fit self-end">
                    <ArrowUpDown size={16} /> المشاركات: {participationSort === 'asc' ? 'الأقل' : 'الأكثر'}
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/30">
              {availableEmployees.map(emp => {
                const isAssigned = selectedRoles.some(r => r.employeeId === emp.id);
                const isTemp = tempSelectedIds.includes(emp.id);
                return (
                  <div key={emp.id} className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${isAssigned ? 'bg-slate-50 border-emerald-200' : (isTemp ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-100' : 'bg-white hover:shadow-md cursor-pointer')}`}
                       onClick={() => handleSelectEmployee(emp)}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${emp.gender === 'ذكر' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                        {isTemp && isMultiSelectMode ? <CheckSquare size={24} /> : (isAssigned ? <CheckCircle2 size={24} className="text-emerald-600" /> : <User size={24} />)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{emp.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{emp.workplace} {isAssigned && <span className="text-emerald-600">(مُعين حالياً)</span>}</p>
                        <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><MapPin size={10} /> {emp.address || 'غير مسجل'}</p>
                      </div>
                    </div>
                    <div className="text-left flex items-center gap-3">
                      <div className="text-[10px] text-slate-400 font-bold text-right mr-4 hidden md:block">
                        <p>{emp.grade}</p>
                        <p>{emp.nationalId}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black ${emp.assignmentCount === 0 ? 'bg-emerald-600 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                          {emp.assignmentCount === 0 ? 'جديد (لم يشارك)' : `شارك ${emp.assignmentCount} مرة`}
                        </span>
                        {emp.lastAssignmentDate && (
                          <span className="text-[9px] text-slate-400 font-bold italic">آخر مشاركة: {emp.lastAssignmentDate}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isMultiSelectMode && tempSelectedIds.length > 0 && (
              <div className="p-6 bg-white border-t flex items-center justify-between">
                <span className="font-bold text-slate-700">مختار ({tempSelectedIds.length}) موظف</span>
                <button onClick={handleConfirmMultiSelect} className="px-10 py-3 bg-emerald-600 text-white font-black rounded-xl shadow-lg">تأكيد التسكين الجماعي</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentCreator;
