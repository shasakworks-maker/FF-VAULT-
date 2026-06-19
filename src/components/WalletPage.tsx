import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  QrCode, 
  Send, 
  History, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  AlertCircle,
  IndianRupee
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  getDoc, 
  setDoc,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, fromAuthEmail } from '../lib/firebase';
import { UserProfile, Deposit, DepositStatus, AppSettings } from '../types';
import logo from '../assets/images/ff_vault_logo_1779359542950.png';

export default function WalletPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!auth.currentUser) return;

    // Real-time Profile Listener
    const profileRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        setLoading(false);
      } else {
        // Initialize profile if it doesn't exist
        const newProfile = {
          email: fromAuthEmail(auth.currentUser?.email || ''),
          balance: 0,
          updatedAt: serverTimestamp()
        };
        setDoc(profileRef, newProfile).then(() => {
          setProfile({ id: auth.currentUser?.uid, ...newProfile } as any);
          setLoading(false);
        });
      }
    }, (error) => {
      console.error("Profile listen error:", error);
      setLoading(false);
    });

    // Real-time Deposits Listener
    const q = query(
      collection(db, 'deposits'), 
      where('userId', '==', auth.currentUser.uid)
    );
    
    const unsubscribeDeposits = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deposit));
      docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setDeposits(docs);
    }, (error) => {
      console.error("Deposits listen error:", error);
    });

    // Real-time Settings Listener
    const settingsRef = doc(db, 'settings', 'payment');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as AppSettings);
      }
    });

    return () => {
      unsubscribeProfile();
      unsubscribeDeposits();
      unsubscribeSettings();
    };
  }, []);

  const handleDepositRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !amount || !transactionId) return;

    setSubmitting(true);
    setSubmissionStatus('idle');
    try {
      const depositData: Omit<Deposit, 'id'> = {
        userId: auth.currentUser.uid,
        userEmail: fromAuthEmail(auth.currentUser.email || ''),
        amount: Number(amount),
        transactionId: transactionId,
        status: DepositStatus.PENDING,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'deposits'), depositData);
      setAmount('');
      setTransactionId('');
      setSubmissionStatus('success');
      setTimeout(() => {
        setSubmissionStatus('idle');
        setShowQR(false);
      }, 4000);
    } catch (error) {
      setSubmissionStatus('error');
      handleFirestoreError(error, 'create', 'deposits');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ff-dark flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-ff-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-lg shadow-ff-orange/10">
              <img 
                src={logo || null} 
                alt="FF VAULT Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase italic leading-none">My Wallet</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Wallet Card */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="ff-glass rounded-3xl p-8 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet className="w-32 h-32 rotate-12" />
              </div>
              
              <p className="text-gray-400 text-sm font-mono uppercase tracking-widest mb-2">Available Balance</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-5xl font-black ff-gradient-text tracking-tighter">
                  ₹{profile?.balance.toLocaleString()}
                </span>
              </div>

              <div className="mt-8 flex space-x-4">
                <button 
                  onClick={() => {
                    setShowQR(!showQR);
                    setSubmissionStatus('idle');
                  }}
                  className="ff-button flex-1 flex items-center justify-center space-x-2"
                >
                  <QrCode className="w-5 h-5" />
                  <span>{showQR ? 'HIDE DEPOSIT' : 'DEPOSIT'}</span>
                </button>
              </div>
            </motion.div>

            {/* QR Section */}
            <AnimatePresence>
              {showQR && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ff-glass rounded-3xl p-8 overflow-hidden"
                >
                  {submissionStatus === 'success' ? (
                    <div className="py-10 text-center space-y-4">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/50">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black italic uppercase ff-gradient-text">Transmission Received</h3>
                        <p className="text-gray-400 text-xs font-medium px-8">Your deposit is being verified against the operational ledger. Credit will appear in your vault soon.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-bold mb-2 uppercase italic tracking-tighter">Scan & Pay</h3>
                        <p className="text-gray-500 text-[10px] font-mono tracking-widest uppercase">Encrypted Payment Gateway</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                        {settings?.qrUrl ? (
                          <img 
                            src={settings.qrUrl || null} 
                            alt="QR Code"
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-300">
                            <QrCode className="w-12 h-12 mb-2" />
                            <p className="text-[10px] font-mono">WAITING_FOR_ASSET...</p>
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleDepositRequest} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Deposit Amount</label>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input 
                              required
                              type="number"
                              placeholder="Min ₹100"
                              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-hidden focus:border-ff-orange/50 transition-all font-mono"
                              value={amount}
                              onChange={e => setAmount(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Transaction ID / UTR</label>
                          <input 
                            required
                            type="text"
                            placeholder="Enter 12-digit UTR"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-hidden focus:border-ff-orange/50 transition-all font-mono"
                            value={transactionId}
                            onChange={e => setTransactionId(e.target.value)}
                          />
                        </div>
                        <button 
                          disabled={submitting}
                          className="ff-button w-full flex items-center justify-center space-x-2 font-black uppercase text-xs tracking-widest"
                        >
                          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                          <span>SUBMIT FOR VERIFICATION</span>
                        </button>
                      </form>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* History Sidebar */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-bold flex items-center">
                <History className="w-5 h-5 mr-2 text-ff-orange" />
                Transaction Log
              </h2>
              <span className="text-[10px] font-mono text-gray-500">REALTIME_FEED</span>
            </div>

            <div className="space-y-3">
              {deposits.length === 0 ? (
                <div className="ff-glass rounded-2xl p-8 text-center text-gray-500 text-sm">
                  No transactions found.
                </div>
              ) : (
                deposits.map((dep) => (
                  <div key={dep.id} className="ff-glass rounded-2xl p-4 flex items-center justify-between border-l-4 border-l-ff-orange">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        dep.status === DepositStatus.CONFIRMED ? 'bg-green-500/10 text-green-500' :
                        dep.status === DepositStatus.REJECTED ? 'bg-red-500/10 text-red-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {dep.status === DepositStatus.CONFIRMED ? <CheckCircle2 className="w-5 h-5" /> :
                         dep.status === DepositStatus.REJECTED ? <XCircle className="w-5 h-5" /> :
                         <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">₹{dep.amount}</p>
                        <p className="text-[10px] text-gray-500 font-mono tracking-tighter">ID: {dep.transactionId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        dep.status === DepositStatus.CONFIRMED ? 'text-green-500' :
                        dep.status === DepositStatus.REJECTED ? 'text-red-500' :
                        'text-blue-500'
                      }`}>
                        {dep.status}
                      </span>
                      <p className="text-[10px] text-gray-600">
                        {dep.createdAt?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-yellow-500/5 rounded-2xl p-6 border border-yellow-500/20">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-yellow-500">Security Protocol</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Verify the transaction ID carefully. Providing false UTR details may result in account termination from the vault.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
