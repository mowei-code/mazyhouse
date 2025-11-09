import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { XMarkIcon } from './icons/XMarkIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { GoogleIcon } from './icons/GoogleIcon';
import { AppleIcon } from './icons/AppleIcon';
import type { UserRole } from '../types';


export const LoginModal: React.FC = () => {
  const { login, register, setLoginModalOpen, loginWithProvider } = useContext(AuthContext);
  
  const [view, setView] = useState<'main' | 'social'>('main');
  const [socialProvider, setSocialProvider] = useState<'Google' | 'Apple' | null>(null);

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'一般用戶' | '付費用戶'>('一般用戶');

  const [error, setError] = useState('');

  const handleMainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('請填寫電子郵件和密碼。');
      return;
    }
    if (isRegister) {
       if (!name.trim() || !phone.trim()) {
        setError('請填寫姓名與連絡電話。');
        return;
      }
      const result = register({ email, password, name, phone, role });
      if (!result.success) {
        setError(result.message);
      }
    } else {
      const success = login(email, password);
      if (!success) {
        setError('電子郵件或密碼錯誤。');
      }
    }
  };

  const handleSocialClick = (provider: 'Google' | 'Apple') => {
    setSocialProvider(provider);
    setView('social');
    setEmail('');
    setError('');
  };

  const handleSocialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('請輸入您的電子郵件地址。');
      return;
    }
    if (/^\S+@\S+\.\S+$/.test(email)) {
      loginWithProvider(email);
    } else {
      setError('請輸入有效的電子郵件格式。');
    }
  };

  const handleBack = () => {
    setView('main');
    setError('');
    setEmail('');
    setPassword('');
  };

  const getTitle = () => {
    if (view === 'social') {
      return `使用 ${socialProvider} 登入`;
    }
    return isRegister ? '註冊新帳號' : '登入會員';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setLoginModalOpen(false)}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden border-2 border-black" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
             <SparklesIcon className="h-6 w-6 text-blue-600"/>
             {getTitle()}
          </h2>
          <button onClick={() => setLoginModalOpen(false)} className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>

        <div className="p-6 space-y-4">
          {view === 'main' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button onClick={() => handleSocialClick('Google')} className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition-colors">
                      <GoogleIcon className="h-5 w-5" />
                      <span className="text-sm font-medium text-gray-700">使用 Google 登入</span>
                  </button>
                   <button onClick={() => handleSocialClick('Apple')} className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition-colors">
                      <AppleIcon className="h-5 w-5" />
                      <span className="text-sm font-medium text-gray-700">使用 Apple 登入</span>
                  </button>
              </div>

              <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="flex-shrink mx-4 text-sm text-gray-500">或</span>
                  <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <form onSubmit={handleMainSubmit} className="space-y-4">
                {isRegister && (
                   <>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1">
                        姓名
                        </label>
                        <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                        />
                    </div>
                    <div>
                        <label htmlFor="phone"className="block text-sm font-medium text-gray-600 mb-1">
                        連絡電話 (手機)
                        </label>
                        <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                        />
                    </div>
                   </>
                )}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
                    電子郵件
                    </label>
                    <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    />
                </div>
                <div>
                    <label htmlFor="password"className="block text-sm font-medium text-gray-600 mb-1">
                    密碼
                    </label>
                    <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={isRegister ? 6 : undefined}
                    />
                    {isRegister && <p className="text-xs text-gray-500 mt-1">密碼長度至少需要6個字元。</p>}
                </div>

                {isRegister && (
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-600 mb-2">
                      註冊身分
                    </legend>
                    <div className="flex gap-x-6">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="role-general"
                          name="role"
                          value="一般用戶"
                          checked={role === '一般用戶'}
                          onChange={() => setRole('一般用戶')}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="role-general" className="text-sm text-gray-700">
                          一般會員
                        </label>
                      </div>
                       <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="role-paid"
                          name="role"
                          value="付費用戶"
                          checked={role === '付費用戶'}
                          onChange={() => setRole('付費用戶')}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="role-paid" className="text-sm text-gray-700">
                          付費會員
                        </label>
                      </div>
                    </div>
                  </fieldset>
                )}

                {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

                <button type="submit" className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                    {isRegister ? '註冊' : '登入'}
                </button>

                <p className="text-sm text-center">
                    {isRegister ? '已經有帳號了？' : '還沒有帳號？'}
                    <button type="button" onClick={() => { setIsRegister(!isRegister); setError(''); }} className="font-medium text-blue-600 hover:underline ml-1">
                    {isRegister ? '點此登入' : '點此註冊'}
                    </button>
                </p>
              </form>
            </>
          )}

          {view === 'social' && socialProvider && (
            <>
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  請輸入您的 {socialProvider} 電子郵件地址以繼續。
                </p>
              </div>
              <form onSubmit={handleSocialSubmit} className="space-y-4">
                <div>
                  <label htmlFor="social-email" className="block text-sm font-medium text-gray-600 mb-1">
                    電子郵件
                  </label>
                  <input
                    type="email"
                    id="social-email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    autoFocus
                  />
                </div>
                
                {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

                <button type="submit" className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                  繼續
                </button>

                <button type="button" onClick={handleBack} className="w-full px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
                  返回
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};