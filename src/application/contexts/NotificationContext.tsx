'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

interface NotificationContextType {
  notify: (title: string, message: string, type?: 'info' | 'success' | 'warning') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = (title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, title, message, type }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      
      {/* Notifications Portal */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10001] w-full max-w-[400px] px-4 pointer-events-none space-y-3">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pointer-events-auto bg-zinc-900/95 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl shadow-2xl flex items-start gap-4"
            >
              <div className={`p-2 rounded-xl shrink-0 ${
                n.type === 'success' ? 'bg-green-500/10 text-green-500' :
                n.type === 'warning' ? 'bg-orange-500/10 text-orange-500' :
                'bg-blue-500/10 text-blue-500'
              }`}>
                <Bell size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white uppercase tracking-tight">{n.title}</p>
                <p className="text-xs text-zinc-400 font-medium italic">{n.message}</p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(nn => nn.id !== n.id))}
                className="text-zinc-600 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
