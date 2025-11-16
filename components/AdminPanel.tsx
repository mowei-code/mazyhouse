
import React, { useState, useContext, useEffect, useRef } from 'react';
import type { User, UserRole } from '../types';
import { AuthContext } from '../contexts/AuthContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { XMarkIcon } from './icons/XMarkIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { DocumentArrowDownIcon } from './icons/DocumentArrowDownIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { TrashIcon } from './icons/TrashIcon';
import { handlePrint, parseMOICSV } from '../utils';
import { saveImportedTransactions, clearImportedTransactions } from '../services/realEstateService';

export const AdminPanel: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, setAdminPanelOpen, currentUser } = useContext(AuthContext);
  const { t } = useContext(SettingsContext);
  const [isEditing, setIsEditing] = useState<User | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('一般用戶');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importStatus, setImportStatus] = useState('');

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
      setSuccess(t(result.messageKey));
      resetForm();
    } else {
      setError(t(result.messageKey));
    }
  };

  const handleDelete = (userEmail: string) => {
    if (window.confirm(t('confirmDeleteUser', { email: userEmail }))) {
      const result = deleteUser(userEmail);
      if (result.success) {
        setSuccess(t(result.messageKey));
      } else {
        setError(t(result.messageKey));
      }
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setImportStatus(t('importing'));
      const reader = new FileReader();
      
      // Try reading as Big5 first as typical for MOI CSVs, if fails fallback might be needed but let's assume Big5/UTF8 distinction
      // Note: FileReader doesn't auto-detect. Browsers default to UTF-8. MOI CSV is often Big5.
      // We will try Big5.
      reader.readAsText(file, 'Big5');

      reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content) {
              try {
                  const properties = parseMOICSV(content);
                  if (properties.length === 0) {
                      // If 0 properties, maybe encoding was wrong (UTF-8?), retry with UTF-8
                      const readerUtf8 = new FileReader();
                      readerUtf8.readAsText(file, 'UTF-8');
                      readerUtf8.onload = (ev) => {
                           const contentUtf8 = ev.target?.result as string;
                           const propertiesUtf8 = parseMOICSV(contentUtf8);
                           if (propertiesUtf8.length > 0) {
                               const count = saveImportedTransactions(propertiesUtf8);
                               setImportStatus(t('importSuccess', { count: count.toString() }));
                           } else {
                               setImportStatus(t('importFailedNoData'));
                           }
                      }
                      return;
                  }
                  const count = saveImportedTransactions(properties);
                  setImportStatus(t('importSuccess', { count: count.toString() }));
              } catch (err) {
                  console.error(err);
                  setImportStatus(t('importFailed'));
              }
          }
      };
      
      reader.onerror = () => {
          setImportStatus(t('importFailed'));
      };
      
      // Reset input
      event.target.value = '';
  };

  const handleClearData = () => {
      if(window.confirm(t('confirmClearData'))) {
          clearImportedTransactions();
          setImportStatus(t('dataCleared'));
      }
  };


  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAdminPanelOpen(false)}>
      <div id="admin-panel-content" className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border-2 border-black" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-200 no-print">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Cog6ToothIcon className="h-6 w-6 text-blue-600"/>
            {t('adminPanel')}
          </h2>
          <button onClick={() => setAdminPanelOpen(false)} className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-grow p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Data Management */}
          <div className="lg:col-span-1 space-y-6">
             {/* Import Section */}
             <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                <h3 className="font-bold text-lg text-blue-800 flex items-center gap-2 mb-3">
                    <ArrowPathIcon className="h-5 w-5" />
                    {t('dataManagement')}
                </h3>
                <p className="text-sm text-blue-700 mb-4 leading-relaxed">
                    {t('dataManagementHint')}
                </p>
                
                <div className="space-y-3">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                    >
                        <DocumentArrowDownIcon className="h-5 w-5" />
                        {t('importCsv')}
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".csv" 
                        className="hidden" 
                    />
                    
                    <button 
                        onClick={handleClearData}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 font-semibold rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                    >
                        <TrashIcon className="h-5 w-5" />
                        {t('clearImportedData')}
                    </button>
                </div>
                {importStatus && (
                    <div className={`mt-3 p-2 rounded text-sm text-center font-medium ${importStatus.includes('成功') || importStatus.includes('Success') ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {importStatus}
                    </div>
                )}
                <div className="mt-4 text-xs text-gray-500 border-t border-blue-200 pt-2">
                    <p>{t('csvFormatNote')}</p>
                    <a href="https://lvr.land.moi.gov.tw/" target="_blank" rel="noreferrer" className="text-blue-600 underline mt-1 block">{t('moiLink')}</a>
                </div>
             </div>
          </div>

          {/* Right Column: User Management */}
          <div className="lg:col-span-2 space-y-3">
            <div id="user-list-table-wrapper">
                <div className="print-title">{t('userList')}</div>
                <div className="flex justify-between items-center no-print">
                    <h3 className="font-bold text-lg">{t('userList')}</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handlePrint('user-list-table-wrapper', `${t('userList')} - ${t('appTitle')}`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300">
                            <PrinterIcon className="h-4 w-4" /> <span className="hidden sm:inline">{t('print')}</span>
                        </button>
                         <button onClick={handleExportCsv} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 text-sm font-semibold rounded-lg hover:bg-green-200">
                            <DocumentArrowDownIcon className="h-4 w-4" /> <span className="hidden sm:inline">{t('exportCsv')}</span>
                        </button>
                        <button onClick={handleAddNew} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700">
                            {t('addUser')}
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg mt-3">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-500">{t('email')}</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500">{t('name')}</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500">{t('phone')}</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500">{t('role')}</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500 no-print">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map(user => (
                                <tr key={user.email}>
                                    <td className="px-4 py-2 whitespace-nowrap">{user.email}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{user.name || '-'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{user.phone || '-'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{t(user.role)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap space-x-2 no-print">
                                        <button onClick={() => handleEdit(user)} className="text-blue-600 hover:underline">{t('edit')}</button>
                                        {currentUser?.email !== user.email && (
                                          <button onClick={() => handleDelete(user.email)} className="text-red-600 hover:underline">{t('delete')}</button>
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
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 no-print mt-4">
                <h3 className="font-bold text-lg mb-4">{t(isAdding ? 'addUser' : 'editUser')}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{t('name')}</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/>
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{t('phone')}</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/>
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{t('email')}</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={!!isEditing} className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-200"/>
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{t('password')}</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t(isEditing ? 'passwordPlaceholderEdit' : 'passwordPlaceholderAdd')} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/>
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{t('role')}</label>
                    <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        {roles.map(r => <option key={r} value={r}>{t(r)}</option>)}
                    </select>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {success && <p className="text-sm text-green-600">{success}</p>}
                    <div className="flex gap-2">
                    <button type="button" onClick={resetForm} className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">{t('cancel')}</button>
                    <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">{t(isAdding ? 'addUser' : 'saveChanges')}</button>
                    </div>
                </form>
                </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
