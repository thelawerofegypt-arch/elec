
import React, { useState } from 'react';
import { 
  UserCog, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Shield, 
  X,
  Lock,
  UserCheck
} from 'lucide-react';
import { Admin } from '../types';

interface Props {
  admins: Admin[];
  setAdmins: React.Dispatch<React.SetStateAction<Admin[]>>;
  currentAdmin: Admin | null;
}

const AdminManagement: React.FC<Props> = ({ admins, setAdmins, currentAdmin }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'مدخل بيانات' as 'مدير نظام' | 'مسؤول إدخال' | 'مدخل بيانات'
  });

  const handleOpenModal = (adm?: Admin) => {
    if (adm) {
      setEditingAdmin(adm);
      setFormData({
        name: adm.name,
        username: adm.username,
        password: '',
        role: adm.role
      });
    } else {
      setEditingAdmin(null);
      setFormData({ name: '', username: '', password: '', role: 'مدخل بيانات' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAdmin) {
      setAdmins(prev => prev.map(a => a.id === editingAdmin.id ? { 
        ...a, 
        name: formData.name,
        username: formData.username,
        role: formData.role,
        password: formData.password || a.password
      } : a));
    } else {
      if (admins.some(a => a.username === formData.username)) {
        alert('اسم المستخدم موجود بالفعل');
        return;
      }
      const newAdmin: Admin = {
        id: crypto.randomUUID(),
        name: formData.name,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        createdAt: new Date().toISOString()
      };
      setAdmins(prev => [...prev, newAdmin]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (id === currentAdmin?.id) {
      alert('لا يمكنك حذف حسابك الحالي');
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذا المسؤول؟')) {
      setAdmins(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <Shield size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">إدارة مستخدمي النظام</h3>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
        >
          <UserPlus size={18} />
          <span>إضافة مسؤول جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">الاسم</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">اسم المستخدم</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">الدور</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">تاريخ الإنشاء</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {admins.map((adm) => (
              <tr key={adm.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 font-semibold text-slate-800">
                  {adm.name}
                  {adm.id === currentAdmin?.id && <span className="mr-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">أنت</span>}
                </td>
                <td className="px-6 py-4 text-slate-600 font-mono text-sm">{adm.username}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    adm.role === 'مدير نظام' ? 'bg-purple-100 text-purple-700' : 
                    adm.role === 'مسؤول إدخال' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {adm.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {new Date(adm.createdAt).toLocaleDateString('ar-EG')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(adm)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(adm.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-scaleIn overflow-hidden">
            <div className="bg-emerald-900 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="text-lg font-bold">{editingAdmin ? 'تعديل بيانات المسؤول' : 'إضافة مسؤول جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-emerald-800 p-1 rounded transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الاسم بالكامل</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">اسم المستخدم</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور {editingAdmin && '(اتركها فارغة لعدم التغيير)'}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    required={!editingAdmin}
                    type="password" 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الدور الوظيفي</label>
                <select 
                  required 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                >
                  <option value="مدخل بيانات">مدخل بيانات (صلاحيات محدودة)</option>
                  <option value="مسؤول إدخال">مسؤول إدخال</option>
                  <option value="مدير نظام">مدير نظام (صلاحيات كاملة)</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg"
                >
                  حفظ
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
