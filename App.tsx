
import React, { useState, useEffect, useMemo, ErrorInfo, ReactNode, useCallback } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  History, 
  FileSpreadsheet,
  PlusCircle,
  LogOut,
  UserCircle,
  UserCog,
  Settings as SettingsIcon,
  Building2,
  Menu,
  X,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Bug,
  Database,
  ArrowUpCircle,
  Sparkles,
  Download,
  Monitor
} from 'lucide-react';
import Dashboard from './components/Dashboard.tsx';
import EmployeeList from './components/EmployeeList.tsx';
import AssignmentCreator from './components/AssignmentCreator.tsx';
import AssignmentHistory from './components/AssignmentHistory.tsx';
import Reports from './components/Reports.tsx';
import AdminManagement from './components/AdminManagement.tsx';
import Profile from './components/Profile.tsx';
import Settings from './components/Settings.tsx';
import ProsecutionManagement from './components/ProsecutionManagement.tsx';
import OfflineIndicator from './components/OfflineIndicator.tsx';
import { ViewType, Employee, Assignment, Admin, Prosecution } from './types.ts';
import { db, initializeDefaultAdmin } from './utils/db.ts';

const APP_VERSION: string = "1.2.2";

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Critical System Error:", error, errorInfo);
  }

  handleReset = async () => {
    if (confirm('هل تريد مسح كافة البيانات وحل المشكلة؟')) {
      await (db as any).delete();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-['Cairo'] text-right" dir="rtl">
          <div className="max-w-3xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 space-y-6">
            <h1 className="text-2xl font-black text-red-600 flex items-center gap-2">
              <AlertTriangle size={32} /> حدث خطأ في النظام
            </h1>
            <p className="text-slate-600">نظام الحماية قام بإيقاف التطبيق لتجنب تلف البيانات.</p>
            <div className="bg-red-50 p-4 rounded-xl font-mono text-xs text-red-800">{this.state.error?.message}</div>
            <div className="flex gap-4">
              <button onClick={() => window.location.reload()} className="flex-1 py-3 bg-slate-800 text-white rounded-xl">تحديث</button>
              <button onClick={this.handleReset} className="flex-1 py-3 bg-red-100 text-red-700 rounded-xl">تصفير البيانات</button>
            </div>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [prosecutions, setProsecutions] = useState<Prosecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // حالة التعديل على انتداب
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('PWA Install prompt is ready');
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('البرنامج مثبت بالفعل أو أن متصفحك لا يدعم هذه الميزة حالياً.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      await initializeDefaultAdmin();
      
      const [allEmployees, allAssignments, allAdmins, allProsecutions] = await Promise.all([
        db.employees.toArray(),
        db.assignments.toArray(),
        db.admins.toArray(),
        db.prosecutions.toArray()
      ]);

      setEmployees(allEmployees);
      setAssignments(allAssignments);
      setAdmins(allAdmins);
      setProsecutions(allProsecutions);
    } catch (err) {
      console.error("Error loading DB:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundAdmin = admins.find(a => a.username === loginForm.username.trim() && a.password === loginForm.password.trim());
    if (foundAdmin) {
      setCurrentAdmin(foundAdmin);
      setIsLoggedIn(true);
    } else {
      alert('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentAdmin(null);
    setCurrentView('DASHBOARD');
    setIsSidebarOpen(false);
  };

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  const handleEditAssignment = (asg: Assignment) => {
    setEditingAssignment(asg);
    setCurrentView('NEW_ASSIGNMENT');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-emerald-900 flex flex-col items-center justify-center p-4 font-['Cairo'] text-white">
        <RefreshCw className="animate-spin mb-4" size={48} />
        <h2 className="text-xl font-bold">جاري تحميل المحرك الرقمي...</h2>
        <p className="text-emerald-300 text-sm mt-2 opacity-70">يتم تهيئة النظام للعمل أوفلاين</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4 font-['Cairo']">
        <OfflineIndicator />
        <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl space-y-8 animate-fadeIn text-right" dir="rtl">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <Building2 className="text-emerald-700" size={40} />
            </div>
            <h1 className="text-2xl font-bold text-emerald-900">نظام إدارة النيابة الإدارية</h1>
            <p className="text-slate-500 text-sm italic">يرجى تسجيل الدخول للمتابعة</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">اسم المستخدم</label>
              <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">كلمة المرور</label>
              <input required type="password" title="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} />
            </div>
            <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg active:scale-95">دخول</button>
          </form>
        </div>
      </div>
    );
  }

  const SidebarItem: React.FC<{ 
    view: ViewType; 
    icon: React.ReactNode; 
    label: string;
    restricted?: boolean;
    dataEntryHidden?: boolean;
  }> = ({ view, icon, label, restricted, dataEntryHidden }) => {
    const isRestricted = restricted && currentAdmin?.role !== 'مدير نظام';
    const isDataEntryHidden = dataEntryHidden && currentAdmin?.role === 'مدخل بيانات';
    if (isRestricted || isDataEntryHidden) return null;
    return (
      <button
        onClick={() => {
          if (view === 'NEW_ASSIGNMENT') setEditingAssignment(null);
          setCurrentView(view);
          setIsSidebarOpen(false);
        }}
        className={`flex items-center gap-3 w-full px-4 py-3 text-right rounded-lg transition-all duration-200 ${
          currentView === view ? 'bg-emerald-700 text-white shadow-md' : 'text-emerald-100 hover:bg-emerald-800'
        }`}
      >
        {icon} <span className="font-semibold">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-['Cairo'] overflow-x-hidden">
      <OfflineIndicator />
      <aside className={`print:hidden w-64 bg-emerald-900 text-white flex flex-col fixed h-full shadow-xl z-40 transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex flex-col items-center border-b border-emerald-800">
          <Building2 size={48} className="mb-2 text-emerald-300" />
          <h1 className="text-lg font-bold text-center">النيابة الإدارية</h1>
          <p className="text-[10px] text-emerald-300 opacity-60">PRO EDITION {APP_VERSION}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarItem view="DASHBOARD" icon={<LayoutDashboard size={20} />} label="لوحة التحكم" />
          <SidebarItem view="EMPLOYEES" icon={<Users size={20} />} label="قاعدة الموظفين" />
          <SidebarItem view="PROSECUTIONS_MANAGEMENT" icon={<Building2 size={20} />} label="إدارة النيابات" dataEntryHidden />
          <SidebarItem view="NEW_ASSIGNMENT" icon={<PlusCircle size={20} />} label="انتداب جديد" />
          <SidebarItem view="HISTORY" icon={<History size={20} />} label="سجل الانتدابات" />
          <SidebarItem view="REPORTS" icon={<FileSpreadsheet size={20} />} label="التقارير والطباعة" />
          <SidebarItem view="ADMIN_MANAGEMENT" icon={<UserCog size={20} />} label="إدارة المسؤولين" restricted />
          
          <div className="pt-4 mt-4 border-t border-emerald-800">
            <SidebarItem view="PROFILE" icon={<UserCircle size={20} />} label="الملف الشخصي" />
            <SidebarItem view="SETTINGS" icon={<SettingsIcon size={20} />} label="إعدادات النظام" restricted />
          </div>
        </nav>

        <div className="p-4 border-t border-emerald-800">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-lg transition-all">
            <LogOut size={20} /> <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:mr-64 w-full text-right" dir="rtl">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-slate-600"><Menu size={24} /></button>
            <h2 className="text-lg font-bold text-emerald-800 uppercase tracking-tight">
              {currentView === 'DASHBOARD' && 'لوحة المعلومات'}
              {currentView === 'EMPLOYEES' && 'قاعدة الموظفين'}
              {currentView === 'PROSECUTIONS_MANAGEMENT' && 'إدارة النيابات'}
              {currentView === 'NEW_ASSIGNMENT' && (editingAssignment ? 'تعديل انتداب' : 'انتداب جديد')}
              {currentView === 'HISTORY' && 'سجل الانتدابات'}
              {currentView === 'REPORTS' && 'التقارير'}
              {currentView === 'ADMIN_MANAGEMENT' && 'المستخدمون'}
              {currentView === 'PROFILE' && 'الملف الشخصي'}
              {currentView === 'SETTINGS' && 'الإعدادات'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden sm:block text-left text-xs">
                <p className="font-bold text-slate-700">{currentAdmin?.name}</p>
                <p className="text-slate-400 uppercase">{currentAdmin?.role}</p>
             </div>
             <img src={currentAdmin?.profilePicture || `https://ui-avatars.com/api/?name=${currentAdmin?.name}&background=064e3b&color=fff`} className="w-9 h-9 rounded-full border border-slate-200 object-cover" alt="Avatar" />
          </div>
        </header>

        <div className="p-4 lg:p-8">
           {currentView === 'DASHBOARD' && <Dashboard employees={employees} assignments={assignments} onNavigate={setCurrentView} />}
           {currentView === 'EMPLOYEES' && <EmployeeList employees={employees} onRefresh={triggerRefresh} prosecutions={prosecutions} currentAdmin={currentAdmin} assignments={assignments} />}
           {currentView === 'PROSECUTIONS_MANAGEMENT' && <ProsecutionManagement prosecutions={prosecutions} setProsecutions={async (p) => { 
             if (typeof p === 'function') {
               const current = await db.prosecutions.toArray();
               const next = p(current);
               await db.prosecutions.clear();
               await db.prosecutions.bulkAdd(next);
             } else {
               await db.prosecutions.clear();
               await db.prosecutions.bulkAdd(p);
             }
             triggerRefresh();
           }} employees={employees} currentAdmin={currentAdmin} />}
           {currentView === 'NEW_ASSIGNMENT' && <AssignmentCreator employees={employees} onComplete={() => { triggerRefresh(); setCurrentView('HISTORY'); setEditingAssignment(null); }} prosecutions={prosecutions} editAssignment={editingAssignment} />}
           {currentView === 'HISTORY' && <AssignmentHistory assignments={assignments} employees={employees} onEdit={handleEditAssignment} />}
           {currentView === 'REPORTS' && <Reports employees={employees} assignments={assignments} />}
           {currentView === 'ADMIN_MANAGEMENT' && <AdminManagement admins={admins} setAdmins={async (a) => {
             if (typeof a === 'function') {
               const current = await db.admins.toArray();
               const next = a(current);
               await db.admins.clear();
               await db.admins.bulkAdd(next);
             } else {
               await db.admins.clear();
               await db.admins.bulkAdd(a);
             }
             triggerRefresh();
           }} currentAdmin={currentAdmin} />}
           {currentView === 'PROFILE' && currentAdmin && <Profile currentAdmin={currentAdmin} setAdmins={async (a) => {
             await db.admins.clear();
             await db.admins.bulkAdd(a);
             triggerRefresh();
           }} setCurrentAdmin={setCurrentAdmin} />}
           {currentView === 'SETTINGS' && <Settings currentAdmin={currentAdmin} />}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default App;
