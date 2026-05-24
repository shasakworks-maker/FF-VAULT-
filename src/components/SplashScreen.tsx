import { motion } from 'motion/react';
import logo from '../assets/images/ff_vault_logo_1779359542950.png';

export default function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-ff-dark flex flex-col items-center justify-center p-8 overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute inset-x-0 top-0 h-96 bg-ff-orange/5 blur-[120px] rounded-full -translate-y-1/2" />
      
      <div className="relative">
        {/* Animated Rings */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0.1 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 border-2 border-ff-orange rounded-[2.5rem]"
        />
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 0.05 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
          className="absolute inset-0 border border-ff-orange rounded-[3rem]"
        />

        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1
          }}
          className="relative w-32 h-32 md:w-48 md:h-48"
        >
          <img 
            src={logo || null} 
            alt="FF VAULT Logo" 
            className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(255,87,34,0.3)]"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-12 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-black italic ff-gradient-text tracking-tighter mb-3">FF VAULT</h1>
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-3">
             <div className="h-px w-8 bg-white/10" />
             <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em]">Operational Security Protocol</p>
             <div className="h-px w-8 bg-white/10" />
          </div>
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 bg-ff-orange rounded-full"
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Decorative lines */}
      <div className="absolute bottom-12 left-12 h-20 w-px bg-linear-to-b from-white/0 via-white/10 to-white/0" />
      <div className="absolute bottom-12 left-12 h-px w-20 bg-linear-to-r from-white/10 via-white/0 to-white/0" />
      
      <div className="absolute top-12 right-12 h-20 w-px bg-linear-to-b from-white/0 via-white/10 to-white/0" />
      <div className="absolute top-12 right-12 h-px w-20 bg-linear-to-l from-white/10 via-white/0 to-white/0" />
    </motion.div>
  );
}
