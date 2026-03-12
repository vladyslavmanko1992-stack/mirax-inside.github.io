import React from 'react';
import { cn } from '../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ className, label, ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-gray-300 uppercase text-sm font-vt323">{label}</label>}
      <input 
        className={cn(
          "bg-[#3a3a3a] border-2 border-[#1e1e1e] text-white p-2 font-vt323 placeholder:text-gray-500 focus:outline-none focus:border-[#a0a0a0]",
          className
        )} 
        {...props} 
      />
    </div>
  );
};
