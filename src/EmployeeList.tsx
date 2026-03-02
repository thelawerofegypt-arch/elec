
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  User,
  UserRound,
  Building2,
  History as HistoryIcon,
  Upload,
  RefreshCw,
  ArrowUpDown,
  Phone,
  Briefcase,
  MapPin,
  ChevronDown,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Database,
  // Fix: Added missing UserPlus icon
  UserPlus
} from 'lucide-react';
import { Employee, Prosecution, Assignment, Admin } from '../types';
import { db } from '../utils/db';
import * as XLSX from 'xlsx';
import { FixedSizeList } from 'react-window';

interface Props {
  employees: Employee[];
  onRefresh: () => void;
  prosecutions: Prosecution[];
  currentAdmin: Admin | null;
  assignments: Assignment[];
}

const EmployeeList: React.FC<Props> = ({ employees, onRefresh, prosecutions, currentAdmin, assignments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'UPDATE' | 'ADD'>('ADD');
  const [importStats, setImportStats] = useState<{updated: number, added: number, skipped: number} | null>(null);
  
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Employee | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // States for searchable prosecution dropdown
  const [isProsDropdownOpen, setIsProsDropdownOpen] = useState(false);
  const [prosSearchQuery, setProsSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDataEntry = currentAdmin?.role === 'مدخل بيانات';

  const [formData, setFormData] = useState({
    serialNumber: '',
    name: '',
    nationalId: '',
    gender: 'ذكر' as 'ذكر' | 'أنثى',
    workplace: '',
    grade: '',
    address: '',
    phone: '',
    isActive: true,
    notes: '',
    assignmentCount: 0
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedAndFilteredEmployees = useMemo(() => {
    const list = employees || [];
    let result = list.filter(e => {
      const term = searchTerm.toLowerCase().trim();
      return (
        (e.name || "").toLowerCase().includes(term) || 
        (e.nationalId || "").includes(term) || 
        (e.workplace || "").toLowerCase().includes(term)
      );
    });

    if (sortOrder) {
      result.sort((a, b) => {
        return sortOrder === 'asc' 
          ? (a.assignmentCount || 0) - (b.assignmentCount || 0)
          : (b.assignmentCount || 0) - (a.assignmentCount || 0);
      });
    }

    return result;
  }, [employees, searchTerm, sortOrder]);

  const filteredProsecutions = useMemo(() => {
    return prosecutions.filter(p => 
      p.name.toLowerCase().includes(prosSearchQuery.toLowerCase())
    );
  }, [prosecutions, prosSearchQuery]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workplace) {
      alert('يرجى اختيار النيابة أولاً');
      return;
    }
    try {
      if (editingEmployee) {
        await db.employees.update(editingEmployee.id, formData);
      } else {
        // التحقق من الرقم القومي عند الإضافة اليدوية
        const exists = await db.employees.where('nationalId').equals(formData.nationalId).first();
        if (exists) {
          alert('هذا الرقم القومي مسجل بالفعل لموظف آخر.');
          return;
        }
        await db.employees.add({
          id: crypto.randomUUID(),
          ...formData
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      alert('خطأ أثناء الحفظ.');
    }
  };

  const processAdvancedImport = async (file: File) => {
    setIsProcessing(true);
    setImportStats(null);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const workbook = XLSX.read(event.target?.result, { type: 'array' });
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[];
        
        let updatedCount = 0;
        let addedCount = 0;
        let skippedCount = 0;

        // تنفيذ العمليات في ترانزاكشن واحد لضمان السرعة والاتساق
        // Fix: Use (db as any).transaction to avoid typing issue with NIAppDB extending Dexie
        await (db as any).transaction('rw', [db.employees, db.prosecutions], async () => {
          for (const row of jsonData) {
            const nid = String(row['الرقم القومي'] || '').trim();
            if (nid.length !== 14) {
              skippedCount++;
              continue;
            }

            const existingEmp = await db.employees.where('nationalId').equals(nid).first();

            if (importMode === 'UPDATE') {
              // الميزة الأولى: تحديث البيانات الناقصة فقط للموجودين
              if (existingEmp) {
                const updates: any = {};
                
                // تحديث رقم الموبايل إذا كان فارغاً في قاعدة البيانات وموجوداً في الملف
                const newPhone = String(row['رقم الموبايل'] || row['الموبايل'] || '').trim();
                if ((!existingEmp.phone || existingEmp.phone.trim() === '') && newPhone) {
                  updates.phone = newPhone;
                }

                // تحديث العنوان إذا كان فارغاً
                const newAddress = String(row['العنوان'] || '').trim();
                if ((!existingEmp.address || existingEmp.address.trim() === '') && newAddress) {
                  updates.address = newAddress;
                }

                if (Object.keys(updates).length > 0) {
                  await db.employees.update(existingEmp.id, updates);
                  updatedCount++;
                } else {
                  skippedCount++;
                }
              } else {
                skippedCount++; // تجاهل غير الموجودين في وضع التحديث
              }
            } else {
              // الميزة الثانية: إضافة موظفين جدد ومنع التكرار
              if (!existingEmp) {
                let gender: 'ذكر' | 'أنثى' = 'ذكر';
                const genderDigit = parseInt(nid.charAt(12));
                if (!isNaN(genderDigit)) gender = genderDigit % 2 === 0 ? 'أنثى' : 'ذكر';

                const newEmp: Employee = {
                  id: crypto.randomUUID(),
                  serialNumber: String(row['مسلسل'] || ''),
                  name: String(row['الاسم'] || '').trim(),
                  nationalId: nid,
                  gender: gender,
                  workplace: String(row['الجهة'] || row['جهة العمل'] || '').trim(),
                  grade: String(row['الدرجة'] || '').trim(),
                  address: String(row['العنوان'] || '').trim(),
                  phone: String(row['رقم الموبايل'] || row['الموبايل'] || '').trim(),
                  isActive: true,
                  assignmentCount: Number(row['عدد المشاركات'] || 0)
                };

                if (newEmp.name && newEmp.workplace) {
                  await db.employees.add(newEmp);
                  addedCount++;
                } else {
                  skippedCount++;
                }
              } else {
                skippedCount++; // منع التكرار في وضع الإضافة
              }
            }
          }
        });

        setImportStats({ updated: updatedCount, added: addedCount, skipped: skippedCount });
        onRefresh();
      } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء معالجة الملف. يرجى التأكد من توافق الأعمدة.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const emp = sortedAndFilteredEmployees[index];
    if (!emp) return null;

    const nid = String(emp.nationalId || "");
    let age = 0;
    if (nid.length >= 7) {
      const birthYear = parseInt(nid.substring(1,3));
      const century = nid.charAt(0) === '3' ? 2000 : 1900;
      age = new Date().getFullYear() - (century + birthYear);
    }
    
    return (
      <div style={style} className="flex items-center border-b border-slate-100 hover:bg-emerald-50/40 px-4 transition-colors">
        <div className="w-12 text-center text-slate-400 font-bold text-xs">{emp.serialNumber || index + 1}</div>
        <div className="flex-1 flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${emp.gender === 'ذكر' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
            {emp.gender === 'ذكر' ? <User size={14} /> : <UserRound size={14} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm truncate">{emp.name}</span>
              <button 
                onClick={() => setViewingHistory(emp)}
                className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
              >
                {emp.assignmentCount || 0} مشاركة
              </button>
            </div>
            <div className="text-[10px] text-blue-600 font-bold flex items-center gap-1 truncate max-w-[200px]"><Building2 size={10} /> {emp.workplace}</div>
          </div>
        </div>
        <div className="w-32 text-center">
          <div className="text-xs font-bold text-slate-700">{age} سنة</div>
          <div className="text-[9px] text-emerald-600 font-bold">{emp.grade}</div>
        </div>
        <div className="w-40 text-center font-mono text-xs text-slate-500">{emp.nationalId}</div>
        <div className="w-24 text-center">
          <span className={`px-2 py-1 rounded-full text-[9px] font-black border ${emp.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {emp.isActive ? 'نشط' : 'مستبعد'}
          </span>
        </div>
        <div className="w-28 flex justify-center gap-1">
          <button onClick={() => setViewingHistory(emp)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><HistoryIcon size={16} /></button>
          {!isDataEntry && (
            <>
              <button onClick={() => { 
                setEditingEmployee(emp); 
                setFormData({ 
                  serialNumber: emp.serialNumber || '',
                  name: emp.name,
                  nationalId: emp.nationalId,
                  gender: emp.gender,
                  workplace: emp.workplace,
                  grade: emp.grade || '',
                  address: emp.address || '',
                  phone: emp.phone || '',
                  isActive: emp.isActive,
                  notes: emp.notes || '',
                  assignmentCount: emp.assignmentCount || 0 
                }); 
                setProsSearchQuery(emp.workplace);
                setIsModalOpen(true); 
              }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={16} /></button>
              <button onClick={() => { if(confirm('حذف الموظف؟')){ db.employees.delete(emp.id); onRefresh(); } }} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg"><Trash2 size={16} /></button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn h-full">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث فوري بالاسم أو الرقم القومي..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl border transition-all ${sortOrder ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
          >
            <ArrowUpDown size={18} />
            <span>{sortOrder === 'asc' ? 'الأقل مشاركة' : 'الأكثر مشاركة'}</span>
          </button>
          {!isDataEntry && (
            <button 
              onClick={() => { setImportStats(null); setIsImportModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 font-bold rounded-xl border border-amber-200 hover:bg-amber-100"
            >
              <Database size={18} />
              <span>مركز الاستيراد</span>
            </button>
          )}
          <button onClick={() => { 
            setEditingEmployee(null); 
            setFormData({ serialNumber: '', name: '', nationalId: '', gender: 'ذكر', workplace: '', grade: '', address: '', phone: '', isActive: true, notes: '', assignmentCount: 0 }); 
            setProsSearchQuery('');
            setIsModalOpen(true); 
          }} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg">إضافة موظف</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 h-[calc(100vh-250px)] flex flex-col overflow-hidden">
        <div className="flex items-center bg-slate-50 border-b border-slate-200 px-4 py-3 shrink-0">
          <div className="w-12 text-center text-xs font-bold text-slate-500">م</div>
          <div className="flex-1 text-sm font-bold text-slate-700">الموظف والجهة</div>
          <div className="w-32 text-center text-sm font-bold text-slate-700">السن/الدرجة</div>
          <div className="w-40 text-center text-sm font-bold text-slate-700">الرقم القومي</div>
          <div className="w-24 text-center text-sm font-bold text-slate-700">الحالة</div>
          <div className="w-28 text-center text-sm font-bold text-slate-700">إجراءات</div>
        </div>
        
        <div className="flex-1">
          <FixedSizeList
            height={500}
            itemCount={sortedAndFilteredEmployees.length}
            itemSize={70}
            width="100%"
            direction="rtl"
          >
            {Row}
          </FixedSizeList>
        </div>
      </div>

      {/* نافذة استيراد البيانات المتقدمة */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn">
            <div className="bg-emerald-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Database size={24} className="text-emerald-400" />
                <h3 className="text-xl font-bold">مركز استيراد وتحديث البيانات</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-8 space-y-6">
              {!importStats ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setImportMode('ADD')}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${importMode === 'ADD' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-100 bg-slate-50 opacity-60'}`}
                    >
                      <UserPlus size={32} className={importMode === 'ADD' ? 'text-emerald-600' : 'text-slate-400'} />
                      <div className="text-center">
                        <p className="font-bold text-slate-800">إضافة موظفين جدد</p>
                        <p className="text-[10px] text-slate-500">تجنب تكرار المسجلين حالياً</p>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setImportMode('UPDATE')}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${importMode === 'UPDATE' ? 'border-amber-600 bg-amber-50' : 'border-slate-100 bg-slate-50 opacity-60'}`}
                    >
                      <RefreshCw size={32} className={importMode === 'UPDATE' ? 'text-amber-600' : 'text-slate-400'} />
                      <div className="text-center">
                        <p className="font-bold text-slate-800">تحديث النواقص</p>
                        <p className="text-[10px] text-slate-500">ملء البيانات الفارغة للمسجلين</p>
                      </div>
                    </button>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                    <AlertCircle className="text-blue-600 shrink-0" size={20} />
                    <div className="text-xs text-blue-800 space-y-1">
                      <p className="font-bold">تنبيهات هامة:</p>
                      <p>• يجب أن يحتوي الملف على عمود باسم "الرقم القومي" للمطابقة.</p>
                      {importMode === 'UPDATE' ? (
                        <p>• سيتم فقط ملء الحقول (الموبايل، العنوان) إذا كانت فارغة في النظام.</p>
                      ) : (
                        <p>• سيتم تجاهل أي موظف رقمه القومي موجود مسبقاً في قاعدة البيانات.</p>
                      )}
                    </div>
                  </div>

                  <label className="block border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all">
                    <div className="flex flex-col items-center gap-4">
                      {isProcessing ? (
                        <RefreshCw className="animate-spin text-emerald-600" size={48} />
                      ) : (
                        <FileSpreadsheet className="text-slate-300" size={48} />
                      )}
                      <div>
                        <p className="font-bold text-slate-700">اضغط لاختيار ملف Excel</p>
                        <p className="text-xs text-slate-400">أو اسحب الملف هنا مباشرة</p>
                      </div>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".xlsx, .xls" 
                      onChange={(e) => e.target.files?.[0] && processAdvancedImport(e.target.files[0])}
                      disabled={isProcessing}
                    />
                  </label>
                </>
              ) : (
                <div className="space-y-6 text-center py-4">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={48} />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-800">اكتملت المعالجة بنجاح</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                      <p className="text-2xl font-black text-blue-600">{importStats.added}</p>
                      <p className="text-[10px] font-bold text-blue-800 uppercase">تمت إضافتهم</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                      <p className="text-2xl font-black text-amber-600">{importStats.updated}</p>
                      <p className="text-[10px] font-bold text-amber-800 uppercase">تم تحديثهم</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-2xl font-black text-slate-600">{importStats.skipped}</p>
                      <p className="text-[10px] font-bold text-slate-800 uppercase">تجاهل/تكرار</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsImportModalOpen(false)}
                    className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:bg-emerald-700 transition-all"
                  >
                    العودة لقائمة الموظفين
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl p-8 space-y-6 my-8">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-bold text-slate-800">{editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">الاسم الكامل</label>
                <input required className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="أدخل الاسم الرباعي..." />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 mr-1">الرقم القومي</label>
                <input required maxLength={14} className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} placeholder="14 رقم..." />
              </div>
              
              {/* Searchable Prosecution Dropdown */}
              <div className="space-y-1 relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-slate-600 mr-1">النيابة (جهة العمل)</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    placeholder="ابحث عن اسم النيابة..."
                    className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={prosSearchQuery}
                    onFocus={() => setIsProsDropdownOpen(true)}
                    onChange={(e) => {
                      setProsSearchQuery(e.target.value);
                      setIsProsDropdownOpen(true);
                      if (formData.workplace) setFormData({...formData, workplace: ''});
                    }}
                  />
                  <ChevronDown className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${isProsDropdownOpen ? 'rotate-180' : ''}`} size={18} />
                </div>
                
                {isProsDropdownOpen && (
                  <div className="absolute z-[110] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto animate-fadeIn">
                    {filteredProsecutions.length > 0 ? (
                      filteredProsecutions.map(p => (
                        <div 
                          key={p.id} 
                          className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-sm font-bold text-slate-700 border-b border-slate-50 last:border-0 flex items-center gap-2"
                          onClick={() => {
                            setFormData({...formData, workplace: p.name});
                            setProsSearchQuery(p.name);
                            setIsProsDropdownOpen(false);
                          }}
                        >
                          <Building2 size={14} className="text-slate-400" />
                          {p.name}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-slate-400 italic text-center">لا توجد نتائج مطابقة</div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 mr-1 flex items-center gap-1"><Briefcase size={12} /> الدرجة الوظيفية</label>
                <input className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} placeholder="مثلاً: كبير، أولى، ثانية..." />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 mr-1 flex items-center gap-1"><Phone size={12} /> رقم الموبايل</label>
                <input className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="010..." />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-emerald-700 mr-1">المشاركات السابقة</label>
                <input type="number" className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl outline-none font-bold text-emerald-800" value={formData.assignmentCount} onChange={e => setFormData({...formData, assignmentCount: parseInt(e.target.value) || 0})} />
              </div>
              <div className="col-span-full space-y-1">
                <label className="block text-xs font-bold text-slate-600 mr-1 flex items-center gap-1"><MapPin size={12} /> العنوان السكني</label>
                <input className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="المحافظة - المركز..." />
              </div>
              <div className="col-span-full p-4 bg-emerald-50 rounded-2xl flex items-center gap-2 border border-emerald-100">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 accent-emerald-600 cursor-pointer" />
                <label htmlFor="isActive" className="text-sm font-bold text-emerald-800 cursor-pointer select-none">الموظف متاح للندب (نشط)</label>
              </div>
              <div className="col-span-full flex gap-4 pt-4">
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 shadow-lg transition-all active:scale-95">حفظ البيانات</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingHistory && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="bg-emerald-900 px-8 py-6 text-white flex justify-between items-center">
               <h3 className="text-xl font-bold">سجل مشاركات: {viewingHistory.name}</h3>
               <button onClick={() => setViewingHistory(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {(assignments || []).filter(a => (a.employeeIds || []).includes(viewingHistory.id)).length > 0 ? (
                assignments.filter(a => a.employeeIds.includes(viewingHistory.id)).map((asg, i) => (
                  <div key={i} className="p-4 mb-2 bg-slate-50 border rounded-2xl flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                    <div>
                      <p className="font-bold text-slate-800">{asg.entityName}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><HistoryIcon size={12} /> {asg.date}</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black">تمت المشاركة</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400">لا يوجد انتدابات مسجلة لهذا الموظف حتى الآن.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
