import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Shield, 
  History, 
  Wallet, 
  ChevronRight, 
  CheckCircle2, 
  Clock,
  Settings,
  Bell,
  CreditCard
} from 'lucide-react';
import { auth, db, fromAuthEmail } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface UserData {
  email: string;
  balance: number;
}

interface Activity {
  id: string;
  type: 'deposit' | 'purchase' | 'notification';
  title: string;
  amount?: number;
  status?: string;
  createdAt: any;
}

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!auth.currentUser) return;

      try {
        // Fetch User Data
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }

        // Fetch Recent Activities (Deposits)
        const depositsQuery = query(
          collection(db, 'deposits'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const depositsSnapshot = await getDocs(depositsQuery);
        const depositActivities: Activity[] = depositsSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'deposit',
          title: `Deposit Request: ₹${doc.data().amount}`,
          amount: doc.data().amount,
          status: doc.data().status,
          createdAt: doc.data().createdAt,
        }));

        // Fetch Recent Activities (Purchases)
        const purchasesQuery = query(
          collection(db, 'purchases'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const purchasesSnapshot = await getDocs(purchasesQuery);
        const purchaseActivities: Activity[] = purchasesSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'purchase',
          title: `Purchased: ${doc.data().listingTitle}`,
          amount: doc.data().amount,
          status: 'confirmed',
          createdAt: doc.data().createdAt,
        }));

        // Combine and Sort
        const combined = [...depositActivities, ...purchaseActivities].sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        }).slice(0, 5);

        setActivities(combined);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-ff-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ff-glass rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <User className="w-32 h-32 text-ff-orange" />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8 relative z-10">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-ff-orange flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-ff-orange/20 border-4 border-white/10 italic">
                {fromAuthEmail(auth.currentUser?.email || '')?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-2xl border-4 border-[#0a0a0b] flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-black tracking-tighter text-white italic">
                  {fromAuthEmail(auth.currentUser?.email || '')?.split('@')[0]?.toUpperCase() || 'AGENT'}
                </h1>
              <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black text-ff-orange uppercase tracking-widest border border-white/5">
                Verified Asset Agent
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-400 font-medium">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-ff-orange/70" />
                <span>{fromAuthEmail(auth.currentUser?.email || '')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-ff-orange/70" />
                <span>Protocol Active Since 2024</span>
              </div>
            </div>
          </div>

          <div className="bg-ff-orange/10 border border-ff-orange/20 rounded-3xl p-6 flex flex-col items-end">
            <p className="text-[10px] font-black text-ff-orange uppercase tracking-widest mb-1 italic">Current Balance</p>
            <h2 className="text-3xl font-black tracking-tighter text-ff-orange italic leading-none">
              ₹{userData?.balance?.toLocaleString() || '0'}
            </h2>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Details */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="ff-glass rounded-[2rem] p-6 border border-white/5 space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center space-x-2">
              <Settings className="w-4 h-4 text-ff-orange" />
              <span>Identity Settings</span>
            </h3>
            
            <div className="space-y-4">
              {[
                { label: 'Security Level', value: '4 (Max)', icon: Shield },
                { label: 'Wallet ID', value: auth.currentUser?.uid.slice(0, 12) + '...', icon: CreditCard },
                { label: 'Login Method', value: 'Email / Password', icon: Bell },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group cursor-default">
                  <div className="flex items-center space-x-3 text-gray-400">
                    <item.icon className="w-4 h-4 text-ff-orange/50 group-hover:text-ff-orange transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                  </div>
                  <span className="text-xs font-black text-white font-mono">{item.value}</span>
                </div>
              ))}
            </div>

            <button className="w-full py-4 bg-white/5 rounded-2xl text-xs font-black text-white uppercase tracking-widest border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center space-x-2 hover:text-ff-orange italic">
              <span>View Security Protocols</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="ff-glass rounded-[2rem] p-6 border border-white/5 h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center space-x-2">
                <History className="w-4 h-4 text-ff-orange" />
                <span>Protocol Logs (Recent Activity)</span>
              </h3>
              <button className="text-[10px] font-black text-ff-orange uppercase tracking-widest hover:underline italic">
                View Full Archive
              </button>
            </div>

            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-center justify-between p-5 bg-white/2 rounded-2xl border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${
                        activity.status === 'confirmed' ? 'bg-green-500/10 text-green-500' :
                        activity.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                        'bg-ff-orange/10 text-ff-orange'
                      }`}>
                        {activity.type === 'deposit' ? <Wallet className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-ff-orange transition-colors">
                          {activity.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[10px] text-gray-500 font-mono">
                            {activity.createdAt?.toDate().toLocaleDateString()}
                          </span>
                          <span className="text-gray-700">•</span>
                          <span className={`text-[9px] font-black uppercase tracking-tighter italic ${
                            activity.status === 'confirmed' ? 'text-green-500' :
                            activity.status === 'rejected' ? 'text-red-500' :
                            'text-ff-orange animate-pulse'
                          }`}>
                            {activity.status || 'Processing'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {activity.status === 'confirmed' && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-50">
                  <div className="w-16 h-16 rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center">
                    <History className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No activity logs found</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
