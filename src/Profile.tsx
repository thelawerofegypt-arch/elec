
import React, { useState, useRef } from 'react';
import { Camera, User, Lock, Save, Shield, BadgeCheck } from 'lucide-react';
import { Admin } from '../types';

interface Props {
  currentAdmin: Admin;
  setAdmins: React.Dispatch<React.SetStateAction<Admin[]>>;
  setCurrentAdmin: React.Dispatch<React.SetStateAction<Admin | null>>;
}

const Profile: React.FC<Props> = ({ currentAdmin, setAdmins, setCurrentAdmin }) => {
  const [name, setName] = useState(currentAdmin.name);
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState(currentAdmin.profilePicture || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for localStorage
        alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 1 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedAdmin: Admin = {
      ...currentAdmin,
      name,
      profilePicture: profilePic,
      password: password || currentAdmin.password
    };

    setAdmins(prev => prev.map(a => a.id === currentAdmin.id ? updatedAdmin : a));
    setCurrentAdmin(updatedAdmin);
    setPassword('');
    alert('تم تحديث الملف الشخصي بنجاح');
  };

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Profile Header Background */}
        <div className="h-32 bg-gradient-to-r from-emerald-800 to-emerald-600"></div>
        
        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-6 flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User size={64} />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all group-hover:scale-110"
              >
                <Camera size={18} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
            </div>
            <h3 className="mt-4 text-2xl font-bold text-slate-800">{currentAdmin.name}</h3>
            <div className="flex items-center gap-1 text-emerald-600 font-semibold mt-1">
              <BadgeCheck size={16} />
              <span>{currentAdmin.role}</span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">الاسم المعروض</label>
                <div className="relative">
                  <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">اسم المستخدم (لا يمكن تغييره)</label>
                <input 
                  disabled
                  type="text" 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                  value={currentAdmin.username}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="block text-sm font-bold text-slate-700">تغيير كلمة المرور (اتركه فارغاً للاحتفاظ بالحالية)</label>
                <div className="relative">
                  <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex gap-4">
              <button 
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg transition-all active:scale-95"
              >
                <Save size={20} />
                حفظ التغييرات
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
          <Shield size={20} />
        </div>
        <div className="text-sm">
          <h4 className="font-bold text-blue-900 mb-1">أمان الحساب</h4>
          <p className="text-blue-800 opacity-80 leading-relaxed">
            بياناتك الشخصية مشفرة محلياً على هذا الجهاز. ينصح بتغيير كلمة المرور بشكل دوري لضمان أعلى مستويات الأمان للنظام.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
