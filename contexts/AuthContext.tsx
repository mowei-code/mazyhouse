import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  register: (details: { email: string; password: string; name: string; phone: string; role: '一般用戶' | '付費用戶' }) => { success: boolean; message: string };
  loginWithProvider: (email: string) => void;
  addUser: (user: User) => { success: boolean; message: string };
  updateUser: (email: string, data: Partial<User>) => { success: boolean; message: string };
  deleteUser: (email: string) => void;
  isLoginModalOpen: boolean;
  setLoginModalOpen: (isOpen: boolean) => void;
  isAdminPanelOpen: boolean;
  setAdminPanelOpen: (isOpen: boolean) => void;
}

export const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isAdminPanelOpen, setAdminPanelOpen] = useState(false);

  // Load users and session from localStorage on initial load
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('app_users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        // Seed initial admin user if no users exist
        const adminUser: User = { email: 'admin@mazylab.com', password: 'admin123', role: '管理員', name: 'Admin', phone: '0912345678' };
        setUsers([adminUser]);
        localStorage.setItem('app_users', JSON.stringify([adminUser]));
      }

      const storedSession = localStorage.getItem('app_session');
      if (storedSession) {
        const loggedInUser = JSON.parse(storedSession);
        // We need to find the full user object from the users list
        const userList = storedUsers ? JSON.parse(storedUsers) : [ { email: 'admin@mazylab.com', password: 'admin123', role: '管理員' } ];
        const fullUser = userList.find((u: User) => u.email === loggedInUser.email);
        if (fullUser) {
          setCurrentUser(fullUser);
        }
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('app_session', JSON.stringify(user));
      setLoginModalOpen(false);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('app_session');
  };

  const register = (details: { email: string; password: string; name: string; phone: string; role: '一般用戶' | '付費用戶' }): { success: boolean; message: string } => {
    if (users.some(u => u.email === details.email)) {
      return { success: false, message: '此電子郵件已被註冊。' };
    }
    if (!details.name.trim()) {
        return { success: false, message: '請輸入姓名。' };
    }
    if (!details.phone.trim()) {
        return { success: false, message: '請輸入連絡電話。' };
    }

    const newUser: User = { 
        email: details.email, 
        password: details.password, 
        role: details.role,
        name: details.name,
        phone: details.phone
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
    // Automatically log in after registration
    login(details.email, details.password);
    return { success: true, message: '註冊成功！' };
  };
  
  const loginWithProvider = (email: string) => {
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        // Log in existing user
        setCurrentUser(existingUser);
        localStorage.setItem('app_session', JSON.stringify(existingUser));
        setLoginModalOpen(false);
    } else {
        // Register and log in new user
        const newUser: User = { 
            email, 
            // Social logins don't have a password in this system
            password: `social_login_${Date.now()}`, 
            role: '一般用戶' 
        };
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        localStorage.setItem('app_users', JSON.stringify(updatedUsers));
        setCurrentUser(newUser);
        localStorage.setItem('app_session', JSON.stringify(newUser));
        setLoginModalOpen(false);
    }
  };


  const addUser = (user: User): { success: boolean; message: string } => {
    if (users.some(u => u.email === user.email)) {
      return { success: false, message: '此電子郵件已被註冊。' };
    }
    if (!user.password || user.password.length < 6) {
        return { success: false, message: '密碼長度至少需要6個字元。' };
    }
    if (!user.name || !user.phone) {
      return { success: false, message: '請填寫姓名與聯絡電話。' };
    }
    const updatedUsers = [...users, user];
    setUsers(updatedUsers);
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
    return { success: true, message: '用戶新增成功。' };
  };

  const updateUser = (email: string, data: Partial<User>): { success: boolean; message: string } => {
    let updatedUsers = [...users];
    const userIndex = updatedUsers.findIndex(u => u.email === email);
    if (userIndex === -1) {
        return { success: false, message: '找不到該用戶。' };
    }

    // Prevent admin from removing their own admin rights if they are the only admin
    const adminCount = users.filter(u => u.role === '管理員').length;
    if (currentUser?.email === email && data.role !== '管理員' && adminCount <= 1) {
      return { success: false, message: '無法移除最後一位管理員的權限。' };
    }
    
    // If password is being updated, check its length
    if (data.password && data.password.length > 0 && data.password.length < 6) {
        return { success: false, message: '新密碼長度至少需要6個字元。' };
    }

    const updatedUser = { ...updatedUsers[userIndex], ...data };
    // If password field is empty string, keep the old password
    if (data.password === '') {
        delete updatedUser.password;
    }

    updatedUsers[userIndex] = updatedUser;

    setUsers(updatedUsers);
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));

    // If the currently logged-in user is the one being updated, refresh their session
    if (currentUser?.email === email) {
        setCurrentUser(updatedUser);
        localStorage.setItem('app_session', JSON.stringify(updatedUser));
    }

    return { success: true, message: '用戶更新成功。' };
  };

  const deleteUser = (email: string) => {
    // Prevent deleting the currently logged-in user
    if (currentUser?.email === email) {
      alert("無法刪除您自己。");
      return;
    }

    // Prevent deleting the last admin
    const userToDelete = users.find(u => u.email === email);
    const adminCount = users.filter(u => u.role === '管理員').length;
    if (userToDelete?.role === '管理員' && adminCount <= 1) {
      alert("無法刪除最後一位管理員。");
      return;
    }

    const updatedUsers = users.filter(u => u.email !== email);
    setUsers(updatedUsers);
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
  };

  return (
    <AuthContext.Provider value={{ 
        currentUser, users, login, logout, register, 
        loginWithProvider,
        addUser, updateUser, deleteUser,
        isLoginModalOpen, setLoginModalOpen,
        isAdminPanelOpen, setAdminPanelOpen
    }}>
      {children}
    </AuthContext.Provider>
  );
};