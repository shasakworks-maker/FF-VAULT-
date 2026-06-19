import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  LogIn, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Mail, 
  Lock, 
  UserPlus, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft 
} from 'lucide-react';
import { 
  signInWithEmailAndPasswordCustom, 
  signUpWithEmailAndPasswordCustom, 
  generatePasswordResetOtpCustom, 
  resetPasswordWithOtpCustom 
} from '../lib/firebase';
import logo from '../assets/images/ff_vault_logo_1779359542950.png';

type TabType = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<TabType>('login');
  
  // Login & Registration state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // OTP Password reset state
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [visibleOtp, setVisibleOtp] = useState<string | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearForm = () => {
    setError(null);
    setSuccess(null);
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setNewPassword('');
    setVisibleOtp(null);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await signInWithEmailAndPasswordCustom(email, password);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid credentials or login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await signUpWithEmailAndPasswordCustom(email, password);
      setSuccess('Account created! Logging into system terminal...');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!email) {
      setError('Please input your registered email address first.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    setVisibleOtp(null);
    try {
      const generatedCode = await generatePasswordResetOtpCustom(email);
      setVisibleOtp(generatedCode);
      setSuccess('Access recovery OTP generated! Look at the terminal card below.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not verify user email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !otp || !newPassword) {
      setError('All recover fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await resetPasswordWithOtpCustom(email, otp, newPassword);
      setSuccess('Authorization protocol updated! Enter your new password to log in.');
      setVisibleOtp(null);
      // Go back to login tab with the same email
      setPassword('');
      setActiveTab('login');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'OTP validation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-ff-dark">
      {/* Background Decorative Cosmic Blueprints */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-ff-red/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-ff-orange/10 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="ff-glass rounded-2xl p-6 sm:p-8 shadow-2xl text-center border border-white/5">
          
          {/* Brand Logo & Title */}
          <div className="flex flex-col items-center mb-6">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="w-16 h-16 rounded-2xl overflow-hidden mb-3 shadow-2xl border border-white/10 group"
            >
              <img 
                src={logo || null} 
                alt="FF VAULT Logo" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <h1 className="text-3xl font-black tracking-tight ff-gradient-text italic leading-none">
              FF VAULT
            </h1>
            <p className="text-gray-400 mt-2 text-xs font-semibold uppercase tracking-widest">Secure Terminal Identity</p>
          </div>

          {/* Action Tabs Menu */}
          {activeTab !== 'forgot' && (
            <div className="flex border-b border-white/5 mb-6">
              <button 
                onClick={() => { setActiveTab('login'); clearForm(); }}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 font-mono ${
                  activeTab === 'login' 
                    ? 'border-ff-orange text-ff-orange bg-white/2' 
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setActiveTab('register'); clearForm(); }}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 font-mono ${
                  activeTab === 'register' 
                    ? 'border-ff-orange text-ff-orange bg-white/2' 
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Error / Success Alerts */}
          {error && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] py-3 px-4 rounded-xl text-left font-mono mb-4 flex items-start space-x-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase tracking-wider text-red-500">System Error</span>
                <span className="opacity-90">{error}</span>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] py-3 px-4 rounded-xl text-left font-mono mb-4 flex items-start space-x-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase tracking-wider text-green-500">System Signal Accepted</span>
                <span className="opacity-90">{success}</span>
              </div>
            </motion.div>
          )}

          {/* Delivery OTP Console Override Warning Card */}
          {activeTab === 'forgot' && visibleOtp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-ff-orange/10 border border-ff-orange/20 rounded-xl p-4 text-left font-mono mb-5 relative overflow-hidden before:absolute before:top-0 before:left-0 before:h-full before:w-1 before:bg-ff-orange"
            >
              <div className="text-[10px] uppercase font-black text-ff-orange tracking-widest flex items-center justify-between mb-1">
                <span>⚠️ SYSTEM CONSOLE OVERRIDE: VERIFICATION CODE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-ff-orange animate-ping" />
              </div>
              <p className="text-gray-400 text-[10px] leading-relaxed">
                Security key redirected safely to this terminal console for current agent:
              </p>
              <div className="mt-2.5 flex items-center justify-between bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-[9px] text-gray-500 font-bold uppercase">Console OTP:</span>
                <span className="text-lg font-black text-ff-orange tracking-widest font-mono select-all">
                  {visibleOtp}
                </span>
              </div>
            </motion.div>
          )}

          {/* Form Flows */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Agent Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="email" 
                    placeholder="email@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-ff-orange transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Terminal Password</label>
                  <button 
                    type="button"
                    onClick={() => { setActiveTab('forgot'); clearForm(); }}
                    className="text-[10px] font-bold text-ff-orange uppercase tracking-wider hover:underline font-mono"
                  >
                    Forgot Access?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-white text-sm focus:outline-none focus:border-ff-orange transition-colors font-mono"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="ff-button w-full flex items-center justify-center space-x-2 mt-4 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'INITIALIZING INTERFACE...' : 'VERIFY AGENT ACCESS'}</span>
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Agent Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="email" 
                    placeholder="email@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-ff-orange transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Set Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-white text-sm focus:outline-none focus:border-ff-orange transition-colors font-mono"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Min 6 characters"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-white text-sm focus:outline-none focus:border-ff-orange transition-colors font-mono"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="ff-button w-full flex items-center justify-center space-x-2 mt-4 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'CREATING PORTAL AGENT...' : 'PROVISION AGENT PORTAL'}</span>
              </button>
            </form>
          )}

          {activeTab === 'forgot' && (
            <div className="space-y-4 text-left">
              <button 
                onClick={() => { setActiveTab('login'); clearForm(); }}
                className="flex items-center space-x-1.5 text-[10px] text-gray-400 hover:text-ff-orange uppercase font-bold tracking-widest transition-colors mb-2 font-mono"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to authentication</span>
              </button>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Agent Email Address</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="email" 
                      placeholder="email@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-ff-orange transition-colors font-mono"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={loading || !email}
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
                  >
                    Generate OTP
                  </button>
                </div>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Enter OTP Verification Code</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-ff-orange transition-colors font-mono tracking-widest"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Set New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-white text-sm focus:outline-none focus:border-ff-orange transition-colors font-mono"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="ff-button w-full flex items-center justify-center space-x-2 mt-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? 'TRANSMITTING RE-RESET AUTH...' : 'SUBMIT RE-RESET PASSWORD'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Secure Badging Section */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-gray-600 text-[9px] uppercase tracking-widest font-mono">
              Terminal authentication beta-v3 // system encrypted
            </p>
            <div className="flex justify-center items-center space-x-4 mt-3 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
               <div className="flex flex-col items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-white mb-0.5" />
                  <span className="text-[7.5px] font-mono">SSL_SECURED</span>
               </div>
               <div className="w-[1px] h-3.5 bg-white/10" />
               <div className="flex flex-col items-center">
                  <div className="text-[7.5px] font-black border border-white/40 px-1 rounded-sm leading-none py-0.5 font-mono">SHA_256</div>
                  <span className="text-[7.5px] font-mono mt-0.5">HASH_SALT</span>
               </div>
               <div className="w-[1px] h-3.5 bg-white/10" />
               <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 border border-white/40 rounded-full flex items-center justify-center">
                    <div className="w-0.5 h-0.5 bg-white/40 rounded-full" />
                  </div>
                  <span className="text-[7.5px] font-mono mt-1">OPSEC_LVL_4</span>
               </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
