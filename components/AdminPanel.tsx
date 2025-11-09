import React, { useState, useContext, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { AuthContext } from '../contexts/AuthContext';
import { XMarkIcon } from './icons/XMarkIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { DocumentArrowDownIcon } from './icons/DocumentArrowDownIcon';

export const AdminPanel: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, setAdminPanelOpen, currentUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState<User | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('一般用戶');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roles: UserRole[] = ['管理員', '一般用戶', '付費用戶'];

  useEffect(() => {
    if (isEditing) {
      setEmail(isEditing.email);
      setPassword(''); // Don't show existing password
      setRole(isEditing.role);
      setName(isEditing.name || '');
      setPhone(isEditing.phone || '');
    }
  }, [isEditing]);

  const resetForm = () => {
    setIsAdding(false);
    setIsEditing(null);
    setEmail('');
    setPassword('');
    setRole('一般用戶');
    setName('');
    setPhone('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    let result;
    if (isAdding) {
      result = addUser({ email, password, role, name, phone });
    } else if (isEditing) {
      const updatedData: Partial<User> = { role, name, phone };
      if (password) {
        updatedData.password = password;
      }
      result = updateUser(isEditing.email, updatedData);
    } else {
        return;
    }

    if (result.success) {
      setSuccess(result.message);
      resetForm();
    } else {
      setError(result.message);
    }
  };

  const handleDelete = (userEmail: string) => {
    if (window.confirm(`您確定要刪除用戶 ${userEmail} 嗎？此操作無法復原。`)) {
      deleteUser(userEmail);
    }
  };

  const handleEdit = (user: User) => {
      setIsAdding(false);
      setIsEditing(user);
      setSuccess('');
      setError('');
  }
  
  const handleAddNew = () => {
      resetForm();
      setIsAdding(true);
  }

  const handlePrint = () => {
      window.print();
  };

  const handleExportCsv = () => {
    const headers = ['Email', 'Name', 'Phone', 'Role'];
    const csvContent = [
      headers.join(','),
      ...users.map(user => [user.email, user.name || '', user.phone || '', user.role].join(','))
    ].join('\n');
    
    // Add BOM for Excel compatibility with UTF-8
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const date = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `mazylab_members_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAdminPanelOpen(false)}>
      <div id="admin-panel-content" className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border-2 border-black" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-200 no-print">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Cog6ToothIcon className="h-6 w-6 text-blue-600"/>
            管理後台
          </h2>
          <button onClick={() => setAdminPanelOpen(false)} className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-grow p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User List */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex justify-between items-center no-print">
                <h3 className="font-bold text-lg">用戶列表</h3>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300">
                        <PrinterIcon className="h-4 w-4" /> 列印
                    </button>
                     <button onClick={handleExportCsv} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 text-sm font-semibold rounded-lg hover:bg-green-200">
                        <DocumentArrowDownIcon className="h-4 w-4" /> 匯出 CSV
                    </button>
                    <button onClick={handleAddNew} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700">
                        新增用戶
                    </button>
                </div>
            </div>
            <div id="user-list-table" className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">電子郵件</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">姓名</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">電話</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">角色</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 no-print">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user.email}>
                                <td className="px-4 py-2 whitespace-nowrap">{user.email}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{user.name || '-'}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{user.phone || '-'}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{user.role}</td>
                                <td className="px-4 py-2 whitespace-nowrap space-x-2 no-print">
                                    <button onClick={() => handleEdit(user)} className="text-blue-600 hover:underline">編輯</button>
                                    {currentUser?.email !== user.email && (
                                      <button onClick={() => handleDelete(user.email)} className="text-red-600 hover:underline">刪除</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>

          {/* Add/Edit Form */}
          {(isAdding || isEditing) && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 no-print">
              <h3 className="font-bold text-lg mb-4">{isAdding ? '新增用戶' : '編輯用戶'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">姓名</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">連絡電話</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">電子郵件</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={!!isEditing} className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-200"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">密碼</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isEditing ? '留白則不變更' : '至少6個字元'} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">角色</label>
                  <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={resetForm} className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">取消</button>
                  <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">{isAdding ? '新增' : '儲存變更'}</button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #admin-panel-content, #admin-panel-content * {
            visibility: visible;
          }
          #admin-panel-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          #user-list-table {
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
};