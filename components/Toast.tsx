
import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const icons = {
  success: <CheckCircle2 size={16} className="text-green-400" />,
  error: <AlertCircle size={16} className="text-red-400" />,
  warning: <AlertTriangle size={16} className="text-yellow-400" />,
  info: <Info size={16} className="text-blue-400" />
};

const borderColors = {
  success: "border-l-green-500",
  error: "border-l-red-500",
  warning: "border-l-yellow-500",
  info: "border-l-blue-500"
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // Match animation duration
  };

  return (
    <div 
      className={`
        flex items-center gap-3 bg-[#262626] border border-[#383838] border-l-4 ${borderColors[toast.type]} 
        text-gray-200 pl-3 pr-2 py-3 rounded shadow-lg min-w-[300px] max-w-[400px] mb-3 backdrop-blur-sm
        transition-all duration-300 ease-in-out cursor-default
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0 animate-in slide-in-from-right-10'}
      `}
      role="alert"
    >
      <div className="shrink-0">
        {icons[toast.type]}
      </div>
      <p className="text-xs font-medium flex-1 leading-snug">{toast.message}</p>
      <button 
        onClick={handleClose} 
        className="p-1.5 text-gray-500 hover:text-white hover:bg-[#333] rounded transition-colors focus:outline-none"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-end">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
};
