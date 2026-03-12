import React from 'react';
import { cn } from '../utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ className, label, options, ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-gray-300 uppercase text-sm font-vt323">{label}</label>}
      <select 
        className={cn(
          "bg-[#3a3a3a] border-2 border-[#1e1e1e] text-white p-2 font-vt323 focus:outline-none focus:border-[#a0a0a0]",
          className
        )} 
        {...props} 
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};
