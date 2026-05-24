import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HeadphonesIcon, 
  MessageSquare, 
  Send, 
  ShieldAlert, 
  ChevronRight,
  ExternalLink,
  LifeBuoy,
  CheckCircle2
} from 'lucide-react';

export default function SupportPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitted(false);
    // Simulate support ticket creation
    setTimeout(() => {
      setSubmitting(false);
      setSubject('');
      setMessage('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    }, 1500);
  };

  const supportChannels = [
    { 
      name: 'Telegram Support', 
      desc: 'Join our private channel for instant operational assistance.',
      icon: MessageSquare,
      color: 'bg-blue-500',
      action: 'Join Now'
    },
    { 
      name: 'Emergency Response', 
      desc: 'Report fraudulent activity or account security breaches.',
      icon: ShieldAlert,
      color: 'bg-red-500',
      action: 'Report'
    }
  ];

  return (
    <div className="p-4 sm:p-8">
      <header className="mb-10">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Tactical Support</h1>
        <p className="text-gray-500 text-sm font-medium">Encrypted communications for vault members</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Support Channels */}
        <div className="space-y-4 lg:col-span-1">
          {supportChannels.map((channel, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02 }}
              className="ff-glass rounded-[2rem] p-6 border border-white/5 group h-full flex flex-col justify-between"
            >
              <div>
                <div className={`w-12 h-12 ${channel.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-${channel.color.split('-')[1]}-500/20`}>
                  <channel.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-black italic tracking-tighter uppercase mb-2 group-hover:text-ff-orange transition-colors">
                  {channel.name}
                </h3>
                <p className="text-gray-500 text-xs font-medium leading-relaxed mb-6">
                  {channel.desc}
                </p>
              </div>
              <button className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-widest border border-white/10 group-hover:border-ff-orange/30">
                <span>{channel.action}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}

          <div className="ff-glass rounded-[2rem] p-6 border border-white/5 bg-ff-orange/5">
             <div className="flex items-start space-x-3">
                <LifeBuoy className="w-5 h-5 text-ff-orange shrink-0 mt-1" />
                <div>
                   <p className="text-sm font-black italic uppercase text-ff-orange mb-1">Knowledge Base</p>
                   <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                      Access our classified guides on ID pricing and security protocols.
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Ticket Form */}
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="ff-glass rounded-[2.5rem] p-8 sm:p-10 border border-white/5"
          >
            <div className="flex items-center space-x-3 mb-8">
               <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <HeadphonesIcon className="w-6 h-6 text-ff-orange" />
               </div>
               <div>
                  <h2 className="text-xl font-black italic tracking-tighter uppercase">Direct Transmission</h2>
                  <p className="text-[10px] text-gray-600 font-mono">ENCRYPTED_MESSAGE_LINK // ACTIVE</p>
               </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence>
                {submitted && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-center space-x-3 text-green-500 mb-6"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-bold uppercase italic tracking-widest">Transmission Transmitted // Expect response soon</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-[10px] font-black italic text-gray-500 uppercase tracking-[0.2em] ml-1">Transmission Subject</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g., Deposit Verification (UTR: 123...)"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-medium focus:border-ff-orange/50 transition-all focus:outline-hidden"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black italic text-gray-500 uppercase tracking-[0.2em] ml-1">Operational Details</label>
                <textarea 
                  required
                  rows={6}
                  placeholder="Detail your operational challenge here..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-medium focus:border-ff-orange/50 transition-all focus:outline-hidden resize-none"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>

              <button 
                disabled={submitting}
                className="ff-button w-full flex items-center justify-center space-x-3 py-5 text-sm"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>TRANSMITTING...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>SEND ENCRYPTED TICKET</span>
                  </>
                )}
              </button>

              <div className="pt-4 flex items-center justify-center space-x-4 opacity-20">
                 <div className="h-px bg-white/10 flex-1" />
                 <ShieldAlert className="w-4 h-4 text-gray-500" />
                 <div className="h-px bg-white/10 flex-1" />
              </div>

              <p className="text-[9px] text-gray-700 text-center font-mono uppercase tracking-[0.3em]">
                Identity Verification Status: Level 4 Confirmed
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
