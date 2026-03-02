
import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  AlertCircle,
  TrendingUp,
  User,
  UserRound,
  ShieldCheck,
  ShieldAlert,
  X,
  UserX
} from 'lucide-react';
import { Employee, Assignment, ViewType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  employees: Employee[];
  assignments: Assignment[];
  onNavigate: (view: ViewType) => void;
}

const Dashboard: React.FC<Props> = ({ employees, assignments, onNavigate }) => {
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  
  const totalEmployees = employees.length;
  const activeCount = employees.filter(e => e.isActive).length;
  const inactiveCount = employees.filter(e => !e.isActive).length;
  const maleCount = employees.filter(e => e.gender === 'ذكر').length;
  const femaleCount = employees.filter(e => e.gender === 'أنثى').length;
  const neverAssigned = employees.filter(e => e.assignmentCount === 0).length;

  const stats = [
    { label: 'إجمالي الموظفين', value: totalEmployees, icon: <Users className="text-blue-600" />, color: 'bg-blue-50' },
    { label: 'الموظفون النشطون', value: activeCount, icon: <ShieldCheck className="text-emerald-600" />, color: 'bg-emerald-50' },
    { 
      label: 'موظفون غير نشطين', 
      value: inactiveCount, 
      icon: <UserX className="text-red-600" />, 
      color: 'bg-red-50',
      clickable: true 
    },
    { label: 'إجمالي الانتدابات', value: assignments.length, icon: <Calendar className="text-purple-600" />, color: 'bg-purple-50' },
  ];

  const inactiveEmployees = employees.filter(e => !e.isActive);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            className={`p-6 rounded-2xl shadow-sm border border-slate-200 bg-white transition-all ${stat.clickable ? 'cursor-pointer hover:shadow-md hover:border-red-300' : ''}`}
            onClick={() => stat.clickable && setShowInactiveModal(true)}
          >
            <div className="flex items-start justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>{stat.icon}</div>
            </div>
            {stat.clickable && (
              <p className="text-[10px] text-red-500 mt-2 font-bold animate-pulse">اضغط لعرض الأسماء</p>
            )}
          </div>
        ))}
      </div>

      {/* Inactive Employees Modal */}
      {showInactiveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-red-100 flex flex-col max-h-[80vh] animate-scaleIn">
            <div className="bg-red-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <UserX size={28} />
                <h3 className="text-xl font-bold">قائمة الموظفين غير النشطين</h3>
              </div>
              <button onClick={() => setShowInactiveModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-50">
              {inactiveEmployees.length > 0 ? (
                <div className="space-y-3">
                  {inactiveEmployees.map((emp, idx) => (
                    <div key={emp.id} className="bg-white p-4 rounded-2xl border border-red-50 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                        <div>
                          <p className="font-bold text-slate-800">{emp.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{emp.workplace}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-red-50 text-red-700 text-[10px] font-black rounded-lg border border-red-100">مستبعد</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">لا يوجد موظفون غير نشطين حالياً.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 justify-end">توزيع النوع (الجندر) <Users size={20} className="text-blue-600" /></h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <User className="mx-auto text-blue-600 mb-1" />
              <span className="text-2xl font-black text-blue-700">{maleCount}</span>
              <p className="text-[10px] text-blue-500 font-bold uppercase">ذكور</p>
            </div>
            <div className="p-4 bg-pink-50 rounded-xl text-center">
              <UserRound className="mx-auto text-pink-600 mb-1" />
              <span className="text-2xl font-black text-pink-700">{femaleCount}</span>
              <p className="text-[10px] text-pink-500 font-bold uppercase">إناث</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 justify-end">إحصائيات المشاركة <TrendingUp size={20} className="text-emerald-600" /></h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'لم يسبق', count: neverAssigned },
                { name: 'شارك', count: totalEmployees - neverAssigned }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" /><YAxis /><Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
