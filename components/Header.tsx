import React from 'react';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-white to-emerald-100 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 lg:px-6 py-4 flex items-center justify-center gap-3 group">
        <div className="bg-blue-600 p-2 rounded-lg transition-transform duration-300 ease-in-out group-hover:rotate-[-12deg] group-hover:scale-110">
          <BuildingOfficeIcon className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">AI 房產估價師</h1>
      </div>
    </header>
  );
};