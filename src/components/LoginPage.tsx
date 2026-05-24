import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { LogIn, Eye, EyeOff, ShieldCheck, Mail } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import logo from '../assets/images/ff_vault_logo_1779359542950.png';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    console.log('Traditional login disabled for now, use Google.');
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      
      // Initialize profile if it doesn't exist
      if (user) {
        const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: user.email || '',
            balance: 0,
            updatedAt: serverTimestamp()
          });
        }
      }
      // App.tsx handles redirect
    } catch (err: any) {
      console.error('Auth Error Details:', err);
      if (err.code === 'auth/user-cancelled' || err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked by browser. Please allow popups or open the app in a new tab.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection or VPN settings.');
      } else if (err.code === 'auth/internal-error') {
        setError('Firebase internal error. Try clearing browser cache and cookies.');
      } else {
        setError(`Auth Error: ${err.message || 'Authentication failed. Please use a different browser or tab.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-ff-dark">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-ff-red/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-ff-orange/10 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="ff-glass rounded-2xl p-8 sm:p-10 shadow-2xl relative z-10 text-center">
          <div className="flex flex-col items-center mb-8">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-20 h-20 rounded-2xl overflow-hidden mb-4 shadow-2xl shadow-ff-orange/20 border border-white/10 group"
            >
              <img 
                src={logo || null} 
                alt="FF VAULT Logo" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <h1 className="text-4xl font-extrabold tracking-tight ff-gradient-text italic">
              FF VAULT
            </h1>
            <p className="text-gray-400 mt-2 text-sm font-medium">Secure Admin Access Required</p>
          </div>

          <div className="space-y-4">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] py-3 px-4 rounded-xl font-mono leading-relaxed">
                  <span className="font-bold block mb-1 uppercase tracking-widest">{error?.startsWith('Auth Error') ? 'TRANSMISSION ERROR' : 'SYSTEM STATUS'}</span>
                  {error}
                </div>
                
                {window.self !== window.top && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter text-center">
                      Detected restricted environment. Attempting secondary bypass...
                    </p>
                    <button 
                      onClick={() => {
                        try {
                          const newWindow = window.open(window.location.href, '_blank');
                          if (!newWindow) {
                            setError('Popup was blocked by your browser. Please allow popups and try again.');
                          }
                        } catch (e) {
                          setError('Failed to open new tab. Please manually copy the URL to a new browser tab.');
                        }
                      }}
                      className="w-full bg-ff-orange/20 hover:bg-ff-orange/30 text-ff-orange text-[10px] font-black py-3 rounded-lg border border-ff-orange/20 uppercase tracking-widest transition-all"
                    >
                      Bypass Restrictions (Open New Tab)
                    </button>
                  </div>
                )}
              </motion.div>
            )}
            
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
              <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN WITH GOOGLE'}</span>
            </button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-gray-500 font-mono">End-to-End Encryption</span></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 opacity-30 pointer-events-none">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input disabled type="text" placeholder="Survivor ID" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white" />
              </div>
              <button disabled type="submit" className="ff-button w-full flex items-center justify-center space-x-2">
                <LogIn className="w-5 h-5" />
                <span>AUTHENTICATE</span>
              </button>
            </form>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5">
            <p className="text-gray-600 text-[10px] uppercase tracking-widest font-mono">
              Identity verification protocol beta-v2 // access restricted
            </p>
            <div className="flex justify-center items-center space-x-4 mt-4 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
               <div className="flex flex-col items-center">
                  <ShieldCheck className="w-4 h-4 text-white mb-1" />
                  <span className="text-[8px] font-mono">SSL_SECURED</span>
               </div>
               <div className="w-[1px] h-4 bg-white/10" />
               <div className="flex flex-col items-center">
                  <div className="text-[8px] font-black border border-white/40 px-1 rounded-sm leading-none py-0.5">256</div>
                  <span className="text-[8px] font-mono mt-1">BIT_AES</span>
               </div>
               <div className="w-[1px] h-4 bg-white/10" />
               <div className="flex flex-col items-center">
                  <div className="w-3 h-3 border-2 border-white/40 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-white/40 rounded-full" />
                  </div>
                  <span className="text-[8px] font-mono mt-1">OPSEC_LVL_4</span>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
