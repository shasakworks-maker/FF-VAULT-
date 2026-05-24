import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  Package, 
  HeadphonesIcon, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Bell,
  User
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import logo from '../assets/images/ff_vault_logo_1779359542950.png';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      if (auth.currentUser) {
        setIsAdmin(auth.currentUser.email === 'ashokpal76199@gmail.com');
      }
    };
    checkAdmin();

    if (auth.currentUser) {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', auth.currentUser.uid),
        where('read', '==', false)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUnreadCount(snapshot.size);
      });
      return () => unsubscribe();
    }
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const menuItems = [
    { name: "ID's Marketplace", icon: Package, path: '/marketplace' },
    { name: 'My Wallet', icon: Wallet, path: '/wallet' },
    { name: 'Data Feed', icon: Bell, path: '/notifications', count: true },
    { name: 'Customer Support', icon: HeadphonesIcon, path: '/support' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  if (isAdmin) {
    menuItems.push({ name: 'Admin Control', icon: ShieldCheck, path: '/admin' });
  }

  return (
    <div className="min-h-screen bg-ff-dark flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-ff-dark border-b border-white/5 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
            <img 
              src={logo || null} 
              alt="FF VAULT" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-xl font-black italic ff-gradient-text tracking-tighter">FF VAULT</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-ff-orange hover:bg-ff-orange hover:text-white transition-all overflow-hidden"
          >
            {auth.currentUser?.email?.[0].toUpperCase()}
          </button>
          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-white p-1">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-ff-dark/95 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 ease-out flex flex-col
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 pb-4">
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-ff-orange/20 group">
              <img 
                src={logo || null} 
                alt="FF VAULT" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter ff-gradient-text italic leading-none">FF VAULT</h1>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">Protocol v2.5.0</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all group relative
                  ${isActive ? 'bg-white/5 text-ff-orange' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-ff-orange' : ''}`} />
                    <span className="font-bold tracking-tight uppercase text-sm">{item.name}</span>
                    {item.count && unreadCount > 0 && (
                      <span className="ml-2 bg-ff-orange text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                    {isActive && (
                      <motion.div 
                        layoutId="activeNav"
                        className="absolute left-0 w-1 h-6 bg-ff-orange rounded-r-full"
                      />
                    )}
                    <ChevronRight className={`ml-auto w-4 h-4 opacity-0 group-hover:opacity-100 transition-all ${isActive ? 'translate-x-0' : '-translate-x-2'}`} />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 px-4 py-6 bg-white/5 rounded-3xl border border-white/5">
             <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Protocol Status</span>
                <div className="flex items-center space-x-1">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Secure</span>
                </div>
             </div>
             <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-500 hover:text-white transition-colors">
                   <ShieldCheck className="w-4 h-4" />
                   <span className="text-[10px] font-mono leading-none">256-BIT ENCRYPTION</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-500 hover:text-white transition-colors">
                   <TrendingUp className="w-4 h-4" />
                   <span className="text-[10px] font-mono leading-none">99.9% TRANSFER RATIO</span>
                </div>
             </div>
          </div>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div 
            onClick={() => {
              navigate('/profile');
              setIsOpen(false);
            }}
            className="bg-white/5 rounded-2xl p-4 border border-white/5 group cursor-pointer hover:border-ff-orange/30 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold text-ff-orange group-hover:bg-ff-orange group-hover:text-white transition-all">
                {auth.currentUser?.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate group-hover:text-ff-orange transition-colors">{auth.currentUser?.email}</p>
                <p className="text-[10px] text-gray-500 font-mono italic">SECURE_AUTH</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-[9px] text-gray-600 font-mono tracking-widest uppercase">
              Encrypted Session // Level 4
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-black/20 backdrop-blur-sm relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,87,34,0.03),transparent_40%)] pointer-events-none" />
        <Outlet />
      </main>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
