import React from 'react';

interface RadioProps {
  checked: boolean;
  onClick?: () => void;
  className?: string;
}

export function Radio({ checked, onClick, className }: RadioProps) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-center relative shrink-0 size-[36px] cursor-pointer ${className || ''}`}
    >
      {checked ? (
         <div className="relative rounded-full shrink-0 size-[20px]">
           <div className="absolute border-[#48b2af] border-[6px] border-solid inset-0 pointer-events-none rounded-full" />
         </div>
      ) : (
         <div className="bg-white relative rounded-full shrink-0 size-[20px]">
           <div className="absolute border-2 border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-full" />
         </div>
      )}
    </div>
  );
}
