import React, { useContext } from 'react';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { AuthContext } from '../contexts/AuthContext';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';

export const Header: React.FC = () => {
  const { currentUser, logout, setLoginModalOpen, setAdminPanelOpen } = useContext(AuthContext);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30 border-b-2 border-black">
      <div className="container mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 group">
          <div className="bg-blue-600 p-2 rounded-lg transition-transform duration-300 ease-in-out group-hover:rotate-[-12deg] group-hover:scale-110">
            <BuildingOfficeIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">AI 房產估價師</h1>
        </div>
        
        <div>
          {currentUser ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:flex items-center gap-2">
                <UserCircleIcon className="h-5 w-5" />
                {currentUser.email}
              </span>
              {currentUser.role === '管理員' && (
                <button onClick={() => setAdminPanelOpen(true)} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1.5" title="管理後台">
                  <Cog6ToothIcon className="h-5 w-5" />
                  <span className="hidden md:inline">管理後台</span>
                </button>
              )}
              <button onClick={logout} className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors flex items-center gap-1.5" title="登出">
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                 <span className="hidden md:inline">登出</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
            >
              登入 / 註冊
            </button>
          )}
        </div>
      </div>
    </header>
  );
};