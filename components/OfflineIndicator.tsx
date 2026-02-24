
import React, { useState, useEffect } from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] animate-fadeIn">
      <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-center gap-3 shadow-lg">
        <WifiOff size={18} />
        <span className="text-sm font-bold">أنت تعمل الآن في وضع عدم الاتصال (Offline). سيتم حفظ التعديلات محلياً.</span>
        <AlertCircle size={16} className="opacity-80" />
      </div>
    </div>
  );
};

export default OfflineIndicator;
