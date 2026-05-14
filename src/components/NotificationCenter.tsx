import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  AlertCircle, 
  Info, 
  Calendar,
  CheckCircle2
} from "lucide-react";
import { 
  subscribeToNotifications, 
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "../services/dataService";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

export function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(user.uid, setNotifications);
    return () => unsubscribe();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    try {
      await markNotificationAsRead(user.uid, id);
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'deadline': return <Calendar className="w-4 h-4 text-red-500" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">실시간 알림</span>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => markAllNotificationsAsRead(user!.uid, notifications.filter(n => !n.read).map(n => n.id))}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      모두 읽음 처리
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={cn(
                        "p-4 border-b border-slate-50 transition-colors cursor-pointer",
                        !n.read ? "bg-blue-50/30 hover:bg-blue-50/50" : "hover:bg-slate-50"
                      )}
                      onClick={() => handleMarkAsRead(n.id)}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5">{getIcon(n.type)}</div>
                        <div className="flex-1">
                          <p className={cn("text-xs leading-snug", !n.read ? "font-bold text-slate-900" : "text-slate-600")}>
                            {n.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            {n.message}
                          </p>
                          <p className="text-[9px] text-slate-300 mt-2 font-mono">
                            {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : n.createdAt}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center flex flex-col items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-slate-200" />
                    <p className="text-xs font-bold text-slate-400">새로운 알림이 없습니다.</p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <button className="text-[10px] font-black text-blue-600 uppercase hover:underline">모든 알림 보기</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
