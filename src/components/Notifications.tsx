import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  BellOff,
  CheckCircle2, 
  CreditCard, 
  Package, 
  ShieldCheck, 
  Clock,
  Trash2,
  Lock,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { AppNotification } from '../types';

export default function Notifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
      setNotifications(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  const markAllAsRead = async () => {
    if (notifications.length === 0) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'notifications', id));
      if (selectedNotification?.id === id) setSelectedNotification(null);
    } catch (err) {
      console.error("Delete notification error:", err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <Package className="w-5 h-5 text-ff-orange" />;
      case 'deposit': return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'admin': return <ShieldCheck className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60)),
      'minute'
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Data Feed</h1>
          <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Protocol Intelligence & Status Updates</p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center space-x-3">
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Clear All Unread</span>
              </button>
            )}
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${unreadCount > 0 ? 'bg-ff-orange animate-pulse' : 'bg-gray-700'}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{unreadCount} Pending Intel</span>
            </div>
          </div>
        )}
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Clock className="w-10 h-10 text-ff-orange animate-spin" />
          <p className="text-gray-500 font-mono text-sm tracking-widest uppercase">Decryption_In_Progress...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="ff-glass rounded-[2.5rem] p-20 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
            <BellOff className="w-10 h-10 text-gray-700" />
          </div>
          <div>
            <h3 className="text-xl font-bold uppercase italic italic tracking-tighter">Silence in the Vault</h3>
            <p className="text-gray-500 text-sm mt-2 max-w-xs">No active protocols or status updates detected at this time.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <motion.div
              layout
              key={n.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                setSelectedNotification(n);
                if (!n.read) markAsRead(n.id);
              }}
              className={`
                ff-glass p-5 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden
                ${n.read ? 'border-white/5 opacity-70 hover:opacity-100' : 'border-ff-orange/30 bg-ff-orange/[0.02]'}
              `}
            >
              {!n.read && (
                <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none">
                  <div className="absolute top-0 right-0 bg-ff-orange text-[8px] font-black italic uppercase px-8 py-1 rotate-45 translate-x-6 -translate-y-1">
                    NEW
                  </div>
                </div>
              )}
              
              <div className="flex items-start space-x-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 ${n.read ? 'bg-white/5' : 'bg-ff-orange/10 border-ff-orange/20'}`}>
                  {getTypeIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className={`font-black uppercase italic tracking-tight ${n.read ? 'text-gray-300' : 'text-white'}`}>
                      {n.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1 group-hover:line-clamp-none transition-all duration-500">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-gray-600 font-mono mt-3 flex items-center uppercase tracking-widest">
                    <Clock className="w-3 h-3 mr-1.5" />
                    {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : 'JUST NOW'}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <button 
                    onClick={(e) => deleteNotification(n.id, e)}
                    className="p-2 hover:bg-red-500/10 rounded-xl text-gray-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className={`w-4 h-4 text-gray-700 group-hover:text-ff-orange transition-all ${n.read ? '' : 'animate-bounce-x'}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotification(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="ff-glass w-full max-w-md rounded-[2.5rem] overflow-hidden relative z-10 p-8"
            >
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-ff-orange/10 border border-ff-orange/20 rounded-xl flex items-center justify-center">
                     {getTypeIcon(selectedNotification.type)}
                   </div>
                   <div>
                     <h2 className="text-lg font-black uppercase italic tracking-tighter leading-none">{selectedNotification.type} Protocol</h2>
                     <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-1">Decrypted Intel</p>
                   </div>
                 </div>
                 <button 
                  onClick={() => setSelectedNotification(null)}
                  className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
               </div>

               <div className="space-y-6">
                 <div>
                   <h1 className="text-2xl font-black italic uppercase tracking-tighter ff-gradient-text mb-2 line-height-tight">
                     {selectedNotification.title}
                   </h1>
                   <p className="text-gray-400 text-sm leading-relaxed">
                     {selectedNotification.message}
                   </p>
                 </div>

                 {selectedNotification.metadata && (
                   <div className="bg-black/40 border border-ff-orange/20 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-[10px] font-black uppercase text-ff-orange tracking-widest italic">Acquired Intel Details</span>
                        <Lock className="w-4 h-4 text-ff-orange" />
                      </div>
                      
                      <div className="space-y-4 font-mono">
                        {selectedNotification.metadata.vaultId && (
                          <div>
                            <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">ID</p>
                            <p className="text-sm font-bold text-white selection:bg-ff-orange/30 select-all">{selectedNotification.metadata.vaultId}</p>
                          </div>
                        )}
                        {selectedNotification.metadata.vaultPassword && (
                          <div>
                            <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Password</p>
                            <p className="text-sm font-bold text-white selection:bg-ff-orange/30 select-all">{selectedNotification.metadata.vaultPassword}</p>
                          </div>
                        )}
                        {selectedNotification.metadata.platform && (
                          <div>
                            <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Platform</p>
                            <p className="text-sm font-bold text-ff-orange uppercase">{selectedNotification.metadata.platform}</p>
                          </div>
                        )}
                      </div>
                   </div>
                 )}

                 <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                      {selectedNotification.createdAt?.toDate().toLocaleString()}
                    </p>
                    <button 
                      onClick={() => setSelectedNotification(null)}
                      className="text-xs font-black text-ff-orange hover:text-white uppercase tracking-widest transition-colors flex items-center space-x-1"
                    >
                      <span>ACKNOWLEDGE</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
