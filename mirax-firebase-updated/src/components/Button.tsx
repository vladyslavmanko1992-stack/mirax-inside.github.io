import React from 'react';
import { cn } from '../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  children, 
  ...props 
}) => {
  const baseStyles = "font-vt323 active:translate-y-[2px] active:shadow-none transition-all duration-75 uppercase tracking-wide flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-[#727272] text-white border-t-2 border-l-2 border-[#dbdbdb] border-b-2 border-r-2 border-[#1e1e1e] hover:bg-[#8b8b8b] shadow-[2px_2px_0px_#000]",
    secondary: "bg-[#3a3a3a] text-gray-200 border-t-2 border-l-2 border-[#505050] border-b-2 border-r-2 border-[#101010] hover:bg-[#4a4a4a] shadow-[2px_2px_0px_#000]",
    danger: "bg-[#aa0000] text-white border-t-2 border-l-2 border-[#ff5555] border-b-2 border-r-2 border-[#550000] hover:bg-[#cc0000] shadow-[2px_2px_0px_#000]",
    success: "bg-[#00aa00] text-white border-t-2 border-l-2 border-[#55ff55] border-b-2 border-r-2 border-[#005500] hover:bg-[#00cc00] shadow-[2px_2px_0px_#000]",
  };

  const sizes = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-xl",
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)} 
      {...props}
    >
      {children}
    </button>
  );
};
