import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  icon,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors duration-150 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#3399FF] text-white hover:bg-[#2288EE] active:bg-[#1177DD]",
    secondary: "bg-[#444444] text-gray-200 hover:bg-[#555555] active:bg-[#333333] border border-[#555555]",
    ghost: "bg-transparent text-[#3399FF] hover:text-[#2288EE] hover:bg-[#333333]",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};