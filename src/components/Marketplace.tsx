import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Search, 
  Filter, 
  DollarSign, 
  ShieldCheck, 
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Tag,
  IndianRupee,
  X,
  CreditCard,
  CheckCircle2,
  Lock,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import { collection, query, where, orderBy, getDocs, onSnapshot, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, auth, isUserAdmin, fromAuthEmail } from '../lib/firebase';
import { Listing, ListingStatus, UserProfile } from '../types';

function ImageSlider({ images, title, className = "h-56", children }: { images: string[], title: string, className?: string, children?: React.ReactNode }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const imagesList = (images || []).filter(url => typeof url === 'string' && url.trim() !== '');

  useEffect(() => {
    setCurrentImageIndex(0);
    setDirection(0);
  }, [images]);

  // Preload all listing images for instant slider interaction
  useEffect(() => {
    if (imagesList.length > 1) {
      imagesList.forEach((url) => {
        const img = new Image();
        img.src = url;
      });
    }
  }, [imagesList]);

  const nextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (imagesList.length === 0) return;
    setDirection(1);
    setCurrentImageIndex((prev) => (prev + 1) % imagesList.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (imagesList.length === 0) return;
    setDirection(-1);
    setCurrentImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
  };

  if (imagesList.length === 0) {
    return (
      <div className={`${className} bg-black/40 flex items-center justify-center text-gray-700 relative`}>
        <Package className="w-12 h-12" />
        {children}
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden bg-black/40 group/slider touch-pan-y`}>
      <AnimatePresence initial={false}>
        <motion.img 
          key={currentImageIndex}
          src={imagesList[currentImageIndex]} 
          alt={`${title} - ${currentImageIndex + 1}`} 
          referrerPolicy="no-referrer"
          initial={{ opacity: 0, x: direction === 0 ? 0 : direction * 150 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction === 0 ? 0 : -direction * 150 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x > 50) prevImage();
            else if (info.offset.x < -50) nextImage();
          }}
          className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/111/fff?text=ASSET+UNAVAILABLE';
          }}
        />
      </AnimatePresence>

      {children}

      {imagesList.length > 1 && (
        <>
          <div className="absolute inset-x-0 bottom-4 flex justify-center space-x-1.5 z-30 pointer-events-none">
            {imagesList.map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentImageIndex ? 'bg-ff-orange w-4' : 'bg-white/30'}`}
              />
            ))}
          </div>
          <button 
            type="button"
            onClick={prevImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-ff-orange p-2 rounded-full text-white md:opacity-0 md:group-hover/slider:opacity-100 transition-all backdrop-blur-md z-40 shadow-lg border border-white/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            type="button"
            onClick={nextImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-ff-orange p-2 rounded-full text-white md:opacity-0 md:group-hover/slider:opacity-100 transition-all backdrop-blur-sm z-40 shadow-lg border border-white/10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}

function ListingCard({ listing, onPurchase }: { listing: Listing, onPurchase: (l: Listing) => void }) {
  const images = listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls : (listing.imageUrl ? [listing.imageUrl] : []);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="ff-glass rounded-[2rem] overflow-hidden group flex flex-col h-full border border-white/5 hover:border-ff-orange/30 transition-all duration-500"
    >
      <ImageSlider images={images} title={listing.title} className="h-64 sm:h-72">
        <div className="absolute top-4 right-4 translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
          <div className="bg-ff-orange text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-2xl flex items-center space-x-1 uppercase tracking-tighter italic border border-white/20">
            <ShieldCheck className="w-3 h-3" />
            <span>Verified ID</span>
          </div>
        </div>
        
        {/* Hover Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 top-1/4 bg-linear-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-10" />
        
        {/* Info Content Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-5 translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
           <div className="flex items-center space-x-3 text-[10px] text-white/90 font-mono mb-3">
              {listing.level ? (
                <div className="flex items-center space-x-1 bg-black/40 px-2 py-1 rounded">
                  <span className="text-ff-orange font-bold uppercase">LVL:</span>
                  <span>{listing.level}</span>
                </div>
              ) : null}
              {listing.rank ? (
                <div className="flex items-center space-x-1 bg-black/40 px-2 py-1 rounded">
                  <span className="text-ff-orange font-bold uppercase">RNK:</span>
                  <span className="uppercase">{listing.rank}</span>
                </div>
              ) : null}
              {listing.region ? (
                <div className="flex items-center space-x-1 bg-black/40 px-2 py-1 rounded">
                  <span className="text-ff-orange font-bold uppercase">LOC:</span>
                  <span className="uppercase">{listing.region}</span>
                </div>
              ) : null}
           </div>

           <div className="flex flex-wrap gap-1.5">
              {listing.features.map((f, i) => (
                <span key={i} className="text-[9px] font-bold bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-md text-white border border-white/10 uppercase tracking-tighter">
                  {f}
                </span>
              ))}
           </div>
        </div>
      </ImageSlider>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-black italic tracking-tighter group-hover:text-ff-orange transition-colors duration-500 uppercase leading-none">
            {listing.title}
          </h3>
          {images.length > 1 && (
            <div className="flex items-center space-x-1 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
              <Tag className="w-3 h-3 text-gray-500" />
              <span className="text-[10px] text-gray-500 font-mono">{images.length}P</span>
            </div>
          )}
        </div>
        <p className="text-gray-500 text-xs font-medium line-clamp-2 mb-4 leading-relaxed">
          {listing.description}
        </p>
        
        <div className="mt-auto space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1 italic">ID Price</p>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-black tracking-tighter text-white">₹{listing.price.toLocaleString()}</span>
              </div>
            </div>
            <button 
              onClick={() => onPurchase(listing)}
              className="bg-white/5 hover:bg-ff-orange hover:text-white p-3 rounded-2xl transition-all duration-500 border border-white/10 hover:border-ff-orange hover:shadow-[0_0_20px_rgba(255,87,34,0.3)]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2 pt-4 border-t border-white/5 py-2">
             <AlertCircle className="w-3.5 h-3.5 text-gray-700" />
             <p className="text-[9px] text-gray-600 font-mono italic uppercase">Operational intel included upon acquisition</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Marketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fetchError, setFetchError] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [acquiredCredentials, setAcquiredCredentials] = useState<{id: string, pass: string, platform: string} | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
      }
    });

    return () => unsubscribeProfile();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'listings'), 
      where('status', '==', ListingStatus.AVAILABLE),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      setListings(docs);
      setLoading(false);
      setFetchError(false);
    }, (error) => {
      console.error("Listing fetch error:", error);
      setLoading(false);
      setFetchError(true);
      setErrorMessage("Could not connect to the vault data hub. Please try again later.");
    });

    return () => unsubscribe();
  }, []);

  const handlePurchase = async () => {
    if (!selectedListing || !auth.currentUser) return;

    setPurchasing(true);
    setPurchaseStatus('idle');
    setErrorMessage('');
    let tempCreds: { id: string, pass: string, platform: string } | null = null;

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        const listingRef = doc(db, 'listings', selectedListing.id);
        
        const userSnap = await transaction.get(userRef);
        const listingSnap = await transaction.get(listingRef);

        if (!userSnap.exists()) throw new Error("Vault account not found.");
        if (!listingSnap.exists()) throw new Error("Asset not found.");

        const userData = userSnap.data() as UserProfile;
        const listingData = listingSnap.data() as Listing;

        if (listingData.status !== ListingStatus.AVAILABLE) {
          throw new Error("Asset has already been acquired by another operative.");
        }

        if (userData.balance < listingData.price) {
          throw new Error("Insufficient credit in your vault wallet.");
        }

        // Deduct balance
        transaction.update(userRef, {
          balance: userData.balance - listingData.price,
          updatedAt: serverTimestamp()
        });

        // Update listing status
        transaction.update(listingRef, {
          status: ListingStatus.SOLD,
          purchasedBy: auth.currentUser!.uid,
          purchasedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Create notification for the user
        const notificationRef = doc(collection(db, 'notifications'));
        transaction.set(notificationRef, {
          userId: auth.currentUser!.uid,
          title: 'Asset Acquired Successfully',
          message: `Operational intel for "${listingData.title}" has been decrypted and added to your catalog.`,
          type: 'purchase',
          read: false,
          createdAt: serverTimestamp(),
          metadata: {
            listingId: selectedListing.id,
            vaultId: listingData.vaultId || '',
            vaultPassword: listingData.vaultPassword || '',
            platform: listingData.platform || 'FREE FIRE'
          }
        });

        // Log transaction
        const purchaseLogRef = doc(collection(db, 'purchases'));
        transaction.set(purchaseLogRef, {
          userId: auth.currentUser!.uid,
          userEmail: fromAuthEmail(auth.currentUser!.email || ''),
          listingId: selectedListing.id,
          listingTitle: selectedListing.title,
          amount: selectedListing.price,
          createdAt: serverTimestamp()
        });

        // Store credentials locally for the success UI
        tempCreds = {
          id: listingData.vaultId || '',
          pass: listingData.vaultPassword || '',
          platform: listingData.platform || 'FREE FIRE'
        };
      });

      if (tempCreds) setAcquiredCredentials(tempCreds);
      setPurchaseStatus('success');
    } catch (error: any) {
      console.error("Purchase error:", error);
      setPurchaseStatus('error');
      setErrorMessage(error.message || "Operation failed. Identity verification required.");
    } finally {
      setPurchasing(false);
    }
  };

  const filteredListings = listings.filter(l => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    
    return (
      (l.title || '').toLowerCase().includes(search) ||
      (l.description || '').toLowerCase().includes(search) ||
      (l.features || []).some(f => f.toLowerCase().includes(search)) ||
      (l.rank || '').toLowerCase().includes(search) ||
      (l.region || '').toLowerCase().includes(search) ||
      (l.level || '').toString().includes(search)
    );
  });

  return (
    <div className="p-4 sm:p-8">
      <header className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Vault Catalog</h1>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-1.5 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-lg">
                <ShieldCheck className="w-3 h-3 text-green-500" />
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Anti-Ban Guarantee</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Verified Seller</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-ff-orange/10 border border-ff-orange/20 px-2.5 py-1 rounded-lg">
                <TrendingUp className="w-3 h-3 text-ff-orange" />
                <span className="text-[10px] font-bold text-ff-orange uppercase tracking-widest">Instant Intel</span>
              </div>
            </div>
          </div>

          <div className="flex flex-1 max-w-md space-x-2">
            {userProfile !== null && (
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 flex flex-col justify-center shrink-0">
                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest leading-none mb-1">Balance</span>
                <span className="text-sm font-black text-ff-orange leading-none">₹{userProfile.balance.toLocaleString()}</span>
              </div>
            )}
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-ff-orange transition-colors" />
              <input 
                type="text" 
                placeholder="Search by ID, feature, or level..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-white focus:outline-hidden focus:border-ff-orange/50 transition-all font-medium text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-white/5 border border-white/10 p-3 rounded-2xl hover:bg-white/10 transition-colors">
              <Filter className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-6 mt-6 pt-6 border-t border-white/5 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center space-x-1 shrink-0">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-5 h-5 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center text-[6px] font-bold ${i === 5 ? 'bg-ff-orange' : ''}`}>
                  {i === 5 ? '+1K' : String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div className="ml-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map(i => (
                  <CheckCircle2 key={i} className="w-2.5 h-2.5 text-ff-orange fill-ff-orange" />
                ))}
              </div>
              <p className="text-[7px] font-mono text-gray-500 uppercase tracking-widest whitespace-nowrap">4.9/5 RATING</p>
            </div>
          </div>
          <div className="hidden sm:flex space-x-8">
            <div className="flex items-center space-x-2 text-[9px] text-gray-600 italic shrink-0 leading-none">
               <span className="text-ff-orange">"</span>
               <span>Incredible speed on the Level 70 transfer. Legit shop!</span>
               <span className="text-ff-orange">"</span>
            </div>
            <div className="flex items-center space-x-2 text-[9px] text-gray-600 italic shrink-0 leading-none">
               <span className="text-ff-orange">"</span>
               <span>Best vault for elite accounts. Highly recommended!</span>
               <span className="text-ff-orange">"</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mb-8 flex items-center space-x-4 overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-2 h-2 bg-ff-orange rounded-full animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] ff-gradient-text italic">Live Feed</span>
        </div>
        <div className="flex-1 overflow-hidden relative h-4">
           <motion.div 
             animate={{ x: [0, -1000] }}
             transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
             className="flex items-center space-x-12 whitespace-nowrap"
           >
             <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest italic">Operative_772 acquired Level 74 Master ID // 4m ago</span>
             <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest italic">New Deposit: ₹2,500 by User_991 // 12m ago</span>
             <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest italic">Elite ID "Glacial Shadow" transferred to Operator_112 // 1h ago</span>
             <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest italic">Operational Ledger Updated: 1,244 Total Transfers Verified</span>
             <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest italic">Protocol Health: 100% // No breaches detected</span>
           </motion.div>
        </div>
      </div>

      {fetchError && (
        <div className="mb-10 bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-center space-x-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div>
            <p className="text-red-500 font-bold uppercase italic italic tracking-tighter">Connection Interrupted</p>
            <p className="text-gray-500 text-xs">{errorMessage}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-10 h-10 text-ff-orange animate-spin" />
          <p className="text-gray-500 font-mono text-sm tracking-widest uppercase">Fetching_Assets...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Package className="w-8 h-8 text-gray-700" />
          </div>
          <h3 className="text-xl font-bold mb-2 uppercase italic">No IDs Found</h3>
          <p className="text-gray-500 text-sm">We couldn't find any assets matching your search criteria. Try a different query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div key={listing.id}>
              <ListingCard listing={listing} onPurchase={setSelectedListing} />
            </div>
          ))}
        </div>
      )}

      {/* Access Modal */}
      <AnimatePresence>
        {selectedListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !purchasing && setSelectedListing(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="ff-glass w-full max-w-lg rounded-[2.5rem] overflow-hidden relative z-10 p-8"
            >
              <button 
                onClick={() => setSelectedListing(null)}
                disabled={purchasing}
                className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {purchaseStatus === 'success' ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-6">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/50">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-black italic uppercase ff-gradient-text tracking-tighter">Access Granted</h2>
                    <p className="text-gray-400 font-medium mt-2">Intel successfully transferred to your decrypted catalog.</p>
                  </div>

                  <div className="w-full bg-black/40 border border-ff-orange/50 rounded-3xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-[10px] font-black uppercase text-ff-orange tracking-widest italic">Operational Ledger</span>
                      <ShieldCheck className="w-4 h-4 text-ff-orange" />
                    </div>
                    
                    <div className="space-y-4 font-mono">
                      <div>
                        <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">ID</p>
                        <p className="text-sm font-bold text-white selection:bg-ff-orange/30">{acquiredCredentials?.id || 'DECRYPTING...'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Password</p>
                        <p className="text-sm font-bold text-white selection:bg-ff-orange/30">{acquiredCredentials?.pass || 'DECRYPTING...'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Platform</p>
                        <p className="text-sm font-bold text-ff-orange uppercase">{acquiredCredentials?.platform || 'FREE FIRE'}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[9px] text-gray-600 font-mono uppercase tracking-widest text-center">
                    This intel has also been pushed to your notification protocols.
                  </p>

                  <button 
                    onClick={() => {
                      setSelectedListing(null);
                      setAcquiredCredentials(null);
                    }}
                    className="ff-button w-full py-4 text-xs tracking-[0.2em]"
                  >
                    RETURN TO VAULT
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-start space-x-6">
                    <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-black/40 group relative">
                      <ImageSlider 
                        images={selectedListing.imageUrls && selectedListing.imageUrls.length > 0 ? selectedListing.imageUrls : (selectedListing.imageUrl ? [selectedListing.imageUrl] : [])} 
                        title={selectedListing.title} 
                        className="w-full h-full"
                      />
                    </div>
                    <div>
                      <div className="bg-ff-orange/10 text-ff-orange text-[10px] font-black px-2 py-1 rounded inline-block uppercase italic tracking-widest mb-2 border border-ff-orange/20">
                        Level 4 Clearance
                      </div>
                      <h2 className="text-2xl font-black italic uppercase leading-tight tracking-tighter mb-1">{selectedListing.title}</h2>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                        {selectedListing.level && (
                          <div className="flex items-center space-x-1 text-[10px] font-mono text-gray-400">
                            <span className="text-ff-orange font-bold">LEVEL:</span>
                            <span>{selectedListing.level}</span>
                          </div>
                        )}
                        {selectedListing.rank && (
                          <div className="flex items-center space-x-1 text-[10px] font-mono text-gray-400">
                            <span className="text-ff-orange font-bold">RANK:</span>
                            <span className="uppercase">{selectedListing.rank}</span>
                          </div>
                        )}
                        {selectedListing.region && (
                          <div className="flex items-center space-x-1 text-[10px] font-mono text-gray-400">
                            <span className="text-ff-orange font-bold">SERVER:</span>
                            <span className="uppercase">{selectedListing.region}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-ff-orange font-bold text-lg">₹{selectedListing.price.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-gray-500 tracking-[0.2em]">Operational Intel</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{selectedListing.description}</p>
                    <div className="flex flex-wrap gap-2">
                       {selectedListing.features.map((f, i) => (
                         <span key={i} className="text-[10px] font-bold bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg text-white uppercase italic">
                           {f}
                         </span>
                       ))}
                    </div>
                  </div>

                  {userProfile && userProfile.balance < selectedListing.price && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">Insufficient Credit</p>
                        <p className="text-xs text-red-500/70 leading-relaxed font-medium">Your current balance is ₹{userProfile.balance.toLocaleString()}. Please refuel your wallet to complete this acquisition.</p>
                      </div>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-500 leading-relaxed font-medium">{errorMessage}</p>
                    </div>
                  )}

                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <button 
                      onClick={handlePurchase}
                      disabled={purchasing || (userProfile !== null && userProfile.balance < selectedListing.price)}
                      className="ff-button w-full flex items-center justify-center space-x-3 py-5 text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                    >
                      {purchasing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>ENCRYPTING...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          <span>SECURE ACQUISITION</span>
                        </>
                      )}
                    </button>
                    <div className="flex items-center justify-center space-x-6">
                       <div className="flex items-center space-x-1 grayscale opacity-50">
                          <Lock className="w-3 h-3" />
                          <span className="text-[8px] font-mono uppercase">256-Bit SSL</span>
                       </div>
                       <div className="flex items-center space-x-1 grayscale opacity-50">
                          <ShieldCheck className="w-3 h-3" />
                          <span className="text-[8px] font-mono uppercase">Anti-Ban</span>
                       </div>
                       <div className="flex items-center space-x-1 grayscale opacity-50">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="text-[8px] font-mono uppercase">Certified</span>
                       </div>
                    </div>
                    <p className="text-[9px] text-gray-700 text-center font-mono uppercase tracking-[0.3em]">
                      All acquisitions are non-refundable // encrypted protocol active
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
