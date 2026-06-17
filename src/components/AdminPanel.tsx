import React, { useState, useEffect, type FormEvent, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Package, 
  IndianRupee, 
  Image as ImageIcon, 
  ListTree, 
  TrendingUp,
  LogOut,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check,
  X,
  User as UserIcon,
  CreditCard,
  Settings as SettingsIcon,
  QrCode,
  Upload,
  Lock
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  updateDoc, 
  runTransaction,
  onSnapshot,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth, handleFirestoreError, storage, isUserAdmin } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Listing, ListingStatus, Deposit, DepositStatus, UserProfile, AppSettings } from '../types';
import logo from '../assets/images/ff_vault_logo_1779359542950.png';

function ImageSlider({ images, title, className = "h-56" }: { images: string[], title: string, className?: string }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imagesList = (images || []).filter(url => typeof url === 'string' && url.trim() !== '');

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [images]);

  const nextImage = (e?: MouseEvent | React.MouseEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (imagesList.length <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % imagesList.length);
  };

  const prevImage = (e?: MouseEvent | React.MouseEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (imagesList.length <= 1) return;
    setCurrentImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
  };

  if (imagesList.length === 0) {
    return (
      <div className={`${className} bg-black/40 flex items-center justify-center text-gray-700`}>
        <Package className="w-12 h-12" />
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden bg-black/40 group/slider touch-pan-y`}>
      <AnimatePresence initial={false} mode="wait">
        <motion.img 
          key={currentImageIndex}
          src={imagesList[currentImageIndex]} 
          alt={`${title} - ${currentImageIndex + 1}`} 
          referrerPolicy="no-referrer"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
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

      {imagesList.length > 1 && (
        <>
          <div className="absolute inset-x-0 bottom-4 flex justify-center space-x-1 z-30 pointer-events-none">
            {imagesList.map((_, i) => (
              <div 
                key={i} 
                className={`w-1 h-1 rounded-full transition-all duration-300 ${i === currentImageIndex ? 'bg-ff-orange w-3' : 'bg-white/30'}`}
              />
            ))}
          </div>
          <button 
            type="button"
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-ff-orange p-1.5 rounded-full text-white md:opacity-0 md:group-hover/slider:opacity-100 transition-all backdrop-blur-md z-40 shadow-lg border border-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-ff-orange p-1.5 rounded-full text-white md:opacity-0 md:group-hover/slider:opacity-100 transition-all backdrop-blur-sm z-40 shadow-lg border border-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}


export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'listings' | 'deposits' | 'users' | 'settings'>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ qrUrl: '' });
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);




  const [newListing, setNewListing] = useState<Partial<Listing>>({
    title: '',
    price: 0,
    description: '',
    imageUrl: '',
    imageUrls: [],
    features: [],
    status: ListingStatus.AVAILABLE,
    level: 0,
    rank: '',
    region: 'India',
    vaultId: '',
    vaultPassword: '',
    platform: 'FREE FIRE'
  });
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    let unsubscribe: () => void;
    setLoading(true);

    if (activeTab === 'listings') {
      const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
        setListings(docs);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, 'list', 'listings');
        setLoading(false);
      });
    } else if (activeTab === 'deposits') {
      const q = query(collection(db, 'deposits'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deposit));
        setDeposits(docs);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, 'list', 'deposits');
        setLoading(false);
      });
    } else if (activeTab === 'users') {
      const q = query(collection(db, 'users'), orderBy('updatedAt', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        setUsers(docs);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, 'list', 'users');
        setLoading(false);
      });
    } else if (activeTab === 'settings') {
      const settingsRef = doc(db, 'settings', 'payment');
      unsubscribe = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as AppSettings);
        }
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, 'get', 'settings/payment');
        setLoading(false);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeTab]);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [userAdjustments, setUserAdjustments] = useState<{ [key: string]: string }>({});
  const [assetInputUrl, setAssetInputUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAdminError("File is too large. Max size is 5MB.");
      return;
    }

    setUploading(true);
    setAdminError(null);
    try {
      const storageRef = ref(storage, `listings/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setNewListing(prev => {
        const urls = prev.imageUrls || [];
        return {
          ...prev,
          imageUrl: prev.imageUrl || downloadURL,
          imageUrls: [...urls, downloadURL]
        };
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      setAdminError(`Upload failed: ${error.message || 'Check storage permissions'}`);
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleAdjustBalance = async (userId: string, amount: number) => {
    if (isNaN(amount) || amount === 0) return;
    
    setProcessingId(userId);
    setAdminError(null);
    
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) {
          throw new Error('User protocol not found');
        }
        
        const currentBalance = userSnap.data().balance || 0;
        const newBalance = currentBalance + amount;
        
        if (newBalance < 0) {
          throw new Error('Insufficient credits for deduction');
        }
        
        transaction.update(userRef, {
          balance: newBalance,
          updatedAt: serverTimestamp()
        });

        // Send notification about balance adjustment
        const notificationRef = doc(collection(db, 'notifications'));
        transaction.set(notificationRef, {
          userId: userId,
          title: amount > 0 ? 'Protocol Credit Added' : 'Protocol Credit Deducted',
          message: amount > 0 
            ? `Your vault wallet has been credited with ₹${amount.toLocaleString()}. Current Balance: ₹${newBalance.toLocaleString()}.`
            : `Your vault wallet has been debited by ₹${Math.abs(amount).toLocaleString()}. Current Balance: ₹${newBalance.toLocaleString()}.`,
          type: 'deposit',
          read: false,
          createdAt: serverTimestamp()
        });
      });
      
      setUserAdjustments(prev => ({ ...prev, [userId]: '' }));
    } catch (error: any) {
      console.error("Balance Adjustment Error:", error);
      setAdminError(error.message || 'Failed to adjust balance');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmDeposit = async (deposit: Deposit) => {
    setProcessingId(deposit.id);
    setAdminError(null);

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', deposit.userId);
        const userSnap = await transaction.get(userRef);
        
        let newBalance = deposit.amount;
        if (userSnap.exists()) {
          newBalance += userSnap.data().balance || 0;
          transaction.update(userRef, { 
            balance: newBalance,
            updatedAt: serverTimestamp()
          });
        } else {
          transaction.set(userRef, {
            email: deposit.userEmail,
            balance: deposit.amount,
            updatedAt: serverTimestamp()
          });
        }

        const depositRef = doc(db, 'deposits', deposit.id);
        transaction.update(depositRef, { 
          status: DepositStatus.CONFIRMED 
        });

        // Send notification to user about deposit approval
        const notificationRef = doc(collection(db, 'notifications'));
        transaction.set(notificationRef, {
          userId: deposit.userId,
          title: 'Deposit Approved',
          message: `Your deposit of ₹${deposit.amount.toLocaleString()} has been confirmed. Credits have been added to your vault wallet.`,
          type: 'deposit',
          read: false,
          createdAt: serverTimestamp()
        });
      });
    } catch (error: any) {
      console.error("Confirm Deposit Error:", error);
      setAdminError(error.message || 'Failed to confirm deposit');
      try {
        handleFirestoreError(error, 'update', `deposits/${deposit.id}`);
      } catch (e) {}
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectDeposit = async (deposit: Deposit) => {
    setProcessingId(deposit.id);
    setAdminError(null);
    try {
      await runTransaction(db, async (transaction) => {
        const depositRef = doc(db, 'deposits', deposit.id);
        transaction.update(depositRef, { status: DepositStatus.REJECTED });

        // Send notification about rejection
        const notificationRef = doc(collection(db, 'notifications'));
        transaction.set(notificationRef, {
          userId: deposit.userId,
          title: 'Deposit Rejected',
          message: `Your deposit request for ₹${deposit.amount.toLocaleString()} was rejected. Please contact support for more information.`,
          type: 'deposit',
          read: false,
          createdAt: serverTimestamp()
        });
      });
    } catch (error: any) {
      console.error("Reject Deposit Error:", error);
      setAdminError(error.message || 'Failed to reject deposit');
    } finally {
      setProcessingId(null);
    }
  };

  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const handleAddListing = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setAdminError(null);
    setSubmitSuccess(null);

    try {
      // Capture any pending image URL in the input field
      let finalImageUrls = [...(newListing.imageUrls || [])];
      let finalImageUrl = newListing.imageUrl || '';

      if (assetInputUrl.trim()) {
        const trimmed = assetInputUrl.trim();
        if (!finalImageUrls.includes(trimmed)) {
          finalImageUrls.push(trimmed);
        }
        if (!finalImageUrl) {
          finalImageUrl = trimmed;
        }
      }

      const listingData = {
        ...newListing,
        imageUrl: finalImageUrls[0] || '', // Use the first image as the primary image
        imageUrls: finalImageUrls,
        sellerId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
      };

      // Ensure creation date is only set on new listings
      if (!editingId) {
        listingData.createdAt = serverTimestamp();
      }

      if (editingId) {
        await updateDoc(doc(db, 'listings', editingId), listingData);
        
        // If the listing was sold and we just added credentials, notify the buyer
        if (newListing.status === ListingStatus.SOLD && newListing.purchasedBy && 
            newListing.vaultId && newListing.vaultPassword) {
          try {
            await addDoc(collection(db, 'notifications'), {
              userId: newListing.purchasedBy,
              title: 'Intel Delivered',
              message: `The secure credentials for "${newListing.title}" have been updated in your catalog.`,
              type: 'purchase',
              read: false,
              createdAt: serverTimestamp(),
              metadata: {
                listingId: editingId,
                vaultId: newListing.vaultId,
                vaultPassword: newListing.vaultPassword,
                platform: newListing.platform || 'FREE FIRE'
              }
            });
          } catch (e) {
            console.error("Failed to notify buyer:", e);
          }
        }
      } else {
        await addDoc(collection(db, 'listings'), listingData);
      }

      setIsAdding(false);
      setEditingId(null);
      setAssetInputUrl('');
      setSubmitSuccess(editingId ? 'Listing updated successfully.' : 'New listing added successfully.');
      setTimeout(() => setSubmitSuccess(null), 5000);
      setNewListing({
        title: '',
        price: 0,
        description: '',
        imageUrl: '',
        imageUrls: [],
        features: [],
        status: ListingStatus.AVAILABLE,
        level: 0,
        rank: '',
        region: 'India',
        vaultId: '',
        vaultPassword: '',
        platform: 'FREE FIRE'
      });
    } catch (error) {
      handleFirestoreError(error, editingId ? 'update' : 'create', editingId ? `listings/${editingId}` : 'listings');
    }
  };

  const handleEdit = (listing: Listing) => {
    setNewListing({
      ...listing,
      imageUrls: listing.imageUrls || (listing.imageUrl ? [listing.imageUrl] : []),
      features: listing.features || [],
      vaultId: listing.vaultId || '',
      vaultPassword: listing.vaultPassword || '',
      platform: listing.platform || 'FREE FIRE'
    });
    setEditingId(listing.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await deleteDoc(doc(db, 'listings', id));
    } catch (error) {
      handleFirestoreError(error, 'delete', `listings/${id}`);
    }
  };

  const toggleSoldStatus = async (id: string, currentStatus: ListingStatus) => {
    try {
      const newStatus = currentStatus === ListingStatus.AVAILABLE ? ListingStatus.SOLD : ListingStatus.AVAILABLE;
      await updateDoc(doc(db, 'listings', id), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, 'update', `listings/${id}`);
    }
  };

  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const handleUpdateSettings = async (e: FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    try {
      await setDoc(doc(db, 'settings', 'payment'), settings);
    } catch (error: any) {
      setAdminError(error.message || 'Failed to update settings');
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setNewListing(prev => ({
        ...prev,
        features: [...(prev.features || []), featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-12">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-lg shadow-ff-orange/10">
            <img 
              src={logo || null} 
              alt="FF VAULT Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight ff-gradient-text uppercase leading-none">Vault Control</h1>
            <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest mt-1">Admin Authorization: Active</p>
          </div>
        </div>
        
        <button 
          onClick={() => signOut(auth)}
          className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Stats / Quick Actions */}
          <div className="space-y-6">
            <div className="ff-glass rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-ff-orange" />
                Performance
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                  <p className="text-gray-500 text-xs font-mono mb-1">TOTAL VAULT</p>
                  <p className="text-2xl font-bold">{listings.length}</p>
                </div>
                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                  <p className="text-gray-500 text-xs font-mono mb-1">AVAILABLE</p>
                  <p className="text-2xl font-bold text-green-500">
                    {listings.filter(l => l.status === ListingStatus.AVAILABLE).length}
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsAdding(true)}
              className="ff-button w-full flex items-center justify-center space-x-2 py-4 text-lg"
            >
              <Plus className="w-6 h-6" />
              <span>ADD NEW ID</span>
            </button>

            <div className="ff-glass rounded-2xl p-2 flex flex-col space-y-1">
              <button 
                onClick={() => setActiveTab('listings')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'listings' ? 'bg-ff-orange text-white font-bold' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <Package className="w-5 h-5" />
                <span>Manage IDs</span>
              </button>
              <button 
                onClick={() => setActiveTab('deposits')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'deposits' ? 'bg-ff-orange text-white font-bold' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Pending Deposits</span>
                {deposits.filter(d => d.status === DepositStatus.PENDING).length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                    {deposits.filter(d => d.status === DepositStatus.PENDING).length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-ff-orange text-white font-bold' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <UserIcon className="w-5 h-5" />
                <span>User Balances</span>
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-ff-orange text-white font-bold' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <SettingsIcon className="w-5 h-5" />
                <span>Vault Settings</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'users' ? (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-2 px-2">
                    <h2 className="text-xl font-bold tracking-tight">Vault Members</h2>
                    <div className="text-gray-500 text-xs font-mono">USER_DATABASE // ENCRYPTED</div>
                  </div>

                  {adminError && activeTab === 'users' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-2xl mb-4 font-mono"
                    >
                      SECURE_ERROR: {adminError}
                    </motion.div>
                  )}

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <Loader2 className="w-10 h-10 text-ff-orange animate-spin" />
                      <p className="text-gray-500 font-mono text-sm">QUERYING_CITIZENS...</p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="ff-glass rounded-2xl p-12 text-center text-gray-500">
                      No users found.
                    </div>
                  ) : (
                    users.map((u) => (
                      <div key={u.id} className="ff-glass rounded-2xl p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                            <span className="text-ff-orange font-bold font-mono">{u.email.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-bold">{u.email}</p>
                            <div className="flex items-center space-x-2">
                              <p className="text-xs text-gray-600 font-mono">UID: {u.id.substring(0, 10)}...</p>
                              <div className="w-1 h-1 rounded-full bg-gray-800" />
                              <p className="text-ff-orange font-black text-sm">₹{u.balance.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="relative flex-1 sm:w-32">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
                            <input 
                              type="number"
                              placeholder="Amount"
                              className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-8 pr-2 text-xs text-white focus:outline-hidden focus:border-ff-orange/50 transition-all font-mono"
                              value={userAdjustments[u.id] || ''}
                              onChange={(e) => setUserAdjustments(prev => ({ ...prev, [u.id]: e.target.value }))}
                            />
                          </div>
                          <button
                            onClick={() => handleAdjustBalance(u.id, Number(userAdjustments[u.id]))}
                            disabled={processingId === u.id || !userAdjustments[u.id]}
                            className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 p-2 rounded-lg transition-all disabled:opacity-50"
                            title="Add Credit"
                          >
                            {processingId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleAdjustBalance(u.id, -Number(userAdjustments[u.id]))}
                            disabled={processingId === u.id || !userAdjustments[u.id]}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 p-2 rounded-lg transition-all disabled:opacity-50"
                            title="Deduct Credit"
                          >
                            {processingId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 rotate-45" />}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              ) : activeTab === 'settings' ? (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-2 px-2">
                    <h2 className="text-xl font-bold tracking-tight">Vault configuration</h2>
                    <div className="text-gray-500 text-xs font-mono">SYSTEM_CONFIG // LEVEL_4</div>
                  </div>

                  <form onSubmit={handleUpdateSettings} className="ff-glass rounded-2xl p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Deposit QR Code URL</label>
                        <div className="flex flex-col space-y-4">
                          <div className="relative">
                            <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                            <input 
                              type="url" 
                              placeholder="Paste QR Code URL (Google Drive, Imgur, etc.)..."
                              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-hidden focus:border-ff-orange/50 transition-all font-mono"
                              value={settings.qrUrl}
                              onChange={e => setSettings({...settings, qrUrl: e.target.value})}
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-600 font-mono italic">Provide a direct link to the payment QR asset.</p>
                      </div>

                      {settings.qrUrl && (
                        <div className="pt-4 flex flex-col items-center">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Live Preview</p>
                          <div className="ff-glass p-2 rounded-2xl border border-ff-orange/30 relative w-48 h-48 flex items-center justify-center overflow-hidden bg-white/5 shadow-2xl shadow-ff-orange/10">
                            <img 
                              src={settings.qrUrl || null} 
                              alt="QR Preview" 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/222/555?text=INVALID+ASSET';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <button type="submit" className="ff-button w-full">
                      {editingId ? 'UPDATE_VAULT_PROTOCOL' : 'AUTHORIZE_NEW_ID'}
                    </button>
                  </form>
                </motion.div>
              ) : activeTab === 'deposits' ? (
                <motion.div
                  key="deposits"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-2 px-2">
                    <h2 className="text-xl font-bold tracking-tight">Deposit Ledger</h2>
                    <div className="text-gray-500 text-xs font-mono">FINANCE_LOG // SECURE</div>
                  </div>

                  {adminError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-2xl mb-4 font-mono overflow-auto max-h-32"
                    >
                      ERROR_REPORT: {adminError}
                    </motion.div>
                  )}

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <Loader2 className="w-10 h-10 text-ff-orange animate-spin" />
                      <p className="text-gray-500 font-mono text-sm">LOADING_LEDGER...</p>
                    </div>
                  ) : deposits.length === 0 ? (
                    <div className="ff-glass rounded-2xl p-12 text-center text-gray-500">
                      No deposit requests found.
                    </div>
                  ) : (
                    deposits.map((dep) => (
                      <div key={dep.id} className="ff-glass rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/5">
                            <UserIcon className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">₹{dep.amount}</p>
                            <p className="text-sm text-gray-400">{dep.userEmail}</p>
                            <p className="text-xs font-mono text-gray-600">UTR: {dep.transactionId}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                          {dep.status === DepositStatus.PENDING ? (
                            <>
                              <button 
                                onClick={() => handleConfirmDeposit(dep)}
                                disabled={processingId !== null}
                                className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                              >
                                {processingId === dep.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                <span>{processingId === dep.id ? 'PENDING...' : 'APPROVE'}</span>
                              </button>
                              <button 
                                onClick={() => handleRejectDeposit(dep)}
                                disabled={processingId !== null}
                                className="flex-1 md:flex-none bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-500 font-bold px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors border border-red-500/20"
                              >
                                {processingId === dep.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                <span>{processingId === dep.id ? 'PENDING...' : 'REJECT'}</span>
                              </button>
                            </>
                          ) : (
                            <span className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest border ${
                              dep.status === DepositStatus.CONFIRMED 
                              ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                            }`}>
                              {dep.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              ) : isAdding ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="ff-glass rounded-2xl p-8"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold">{editingId ? 'Edit ID Intel' : 'New ID Disclosure'}</h2>
                    <button 
                      onClick={() => {
                        setIsAdding(false);
                        setEditingId(null);
                        setNewListing({
                          title: '',
                          price: 0,
                          description: '',
                          imageUrl: '',
                          imageUrls: [],
                          features: [],
                          status: ListingStatus.AVAILABLE,
                          level: 0,
                          rank: '',
                          region: 'India',
                          vaultId: '',
                          vaultPassword: '',
                          platform: 'FREE FIRE'
                        });
                      }} 
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      CANCEL
                    </button>
                  </div>

                  <form onSubmit={handleAddListing} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">ID Designation (Title)</label>
                        <div className="relative">
                          <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                          <input 
                            required
                            type="text" 
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-hidden focus:border-ff-orange/50 transition-all"
                            value={newListing.title}
                            onChange={e => setNewListing({...newListing, title: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">ID Price</label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                          <input 
                            required
                            type="number" 
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-hidden focus:border-ff-orange/50 transition-all font-mono"
                            value={newListing.price}
                            onChange={e => setNewListing({...newListing, price: Number(e.target.value)})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Account Level</label>
                        <input 
                          type="number" 
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-hidden focus:border-ff-orange/50 transition-all font-mono"
                          value={newListing.level}
                          onChange={e => setNewListing({...newListing, level: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Current Rank</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Heroic, Master"
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-hidden focus:border-ff-orange/50 transition-all"
                          value={newListing.rank}
                          onChange={e => setNewListing({...newListing, rank: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Server/Region</label>
                        <input 
                          type="text" 
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-hidden focus:border-ff-orange/50 transition-all"
                          value={newListing.region}
                          onChange={e => setNewListing({...newListing, region: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="bg-ff-orange/5 border border-ff-orange/20 rounded-2xl p-6 space-y-6">
                      <div className="flex items-center space-x-2 mb-2">
                        <Lock className="w-4 h-4 text-ff-orange" />
                        <h3 className="text-xs font-black uppercase text-ff-orange tracking-[0.2em]">Secure Credentials (Purchaser Exclusive)</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">ID</label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-hidden focus:border-ff-orange/50 transition-all font-mono"
                            placeholder="Account Login ID"
                            value={newListing.vaultId}
                            onChange={e => setNewListing({...newListing, vaultId: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Password</label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-hidden focus:border-ff-orange/50 transition-all font-mono"
                            placeholder="Account Password"
                            value={newListing.vaultPassword}
                            onChange={e => setNewListing({...newListing, vaultPassword: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Platform</label>
                        <input 
                          required
                          type="text" 
                          className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-hidden focus:border-ff-orange/50 transition-all font-mono"
                          placeholder="Login Platform"
                          value={newListing.platform}
                          onChange={e => setNewListing({...newListing, platform: e.target.value})}
                        />
                      </div>
                    </div>

                      <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Visual Assets (Upload or Paste URLs)</label>
                        <p className="text-[9px] text-ff-orange/70 font-mono pl-1 uppercase tracking-tighter mb-1">Upload from device or use direct image links.</p>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* URL Input */}
                            <div className="relative">
                              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                              <input 
                                type="url" 
                                placeholder="Paste Image URL and press Enter..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-sm text-white focus:outline-hidden focus:border-ff-orange/50 transition-all font-mono"
                                value={assetInputUrl}
                                onChange={(e) => setAssetInputUrl(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (assetInputUrl.trim()) {
                                      const trimmedUrl = assetInputUrl.trim();
                                      setNewListing(prev => {
                                        const urls = prev.imageUrls || [];
                                        if (urls.includes(trimmedUrl)) return prev;
                                        return {
                                          ...prev,
                                          imageUrl: prev.imageUrl || trimmedUrl,
                                          imageUrls: [...urls, trimmedUrl]
                                        };
                                      });
                                      setAssetInputUrl('');
                                    }
                                  }
                                }}
                              />
                              {assetInputUrl && (
                                <button 
                                  type="button"
                                  onClick={() => setAssetInputUrl('')}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {/* File Upload */}
                            <div className="relative">
                              <input 
                                type="file" 
                                id="file-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                key={uploading ? 'uploading' : 'ready'}
                              />
                              <label 
                                htmlFor="file-upload"
                                className={`flex items-center justify-center space-x-2 w-full h-full bg-white/5 border border-dashed border-white/20 rounded-xl py-3 px-4 cursor-pointer hover:bg-white/10 hover:border-ff-orange/50 transition-all group ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {uploading ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-ff-orange" />
                                ) : (
                                  <Upload className="w-4 h-4 text-gray-500 group-hover:text-ff-orange" />
                                )}
                                <span className="text-xs font-bold text-gray-400 group-hover:text-white uppercase tracking-widest italic leading-none pt-0.5">
                                  {uploading ? 'UPLOADING...' : 'UPLOAD FROM DEVICE'}
                                </span>
                              </label>
                            </div>
                          </div>

                          {newListing.imageUrls && newListing.imageUrls.length > 0 && (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                              {newListing.imageUrls.map((url, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group shadow-lg">
                                  <img src={url || null} alt={`Asset ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const newUrls = [...(newListing.imageUrls || [])];
                                      newUrls.splice(idx, 1);
                                      setNewListing(prev => ({
                                        ...prev,
                                        imageUrls: newUrls,
                                        imageUrl: prev.imageUrl === url ? (newUrls[0] || '') : prev.imageUrl
                                      }));
                                    }}
                                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 sm:opacity-0 group-hover:opacity-100 transition-all shadow-xl border border-white/20 z-10"
                                    title="Remove Asset"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                  {newListing.imageUrl === url && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-ff-orange/90 backdrop-blur-sm text-white text-[7px] font-black tracking-widest text-center py-0.5 uppercase italic">
                                      Primary
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Operational Intel (Description)</label>
                      <textarea 
                        required
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-hidden focus:border-ff-orange/50 transition-all min-h-[100px]"
                        value={newListing.description}
                        onChange={e => setNewListing({...newListing, description: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Elite Features (e.g., Level 75, Criminal Bundle)</label>
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <ListTree className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                          <input 
                            type="text" 
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-hidden focus:border-ff-orange/50 transition-all"
                            value={featureInput}
                            onChange={e => setFeatureInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={addFeature}
                          className="px-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-bold"
                        >
                          ADD
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newListing.features?.map((f, i) => (
                          <span key={i} className="bg-ff-orange/20 text-ff-orange px-3 py-1 rounded-full text-xs font-bold border border-ff-orange/30 flex items-center">
                            {f}
                            <button 
                              type="button"
                              onClick={() => setNewListing(prev => ({...prev, features: prev.features?.filter((_, idx) => idx !== i)}))}
                              className="ml-2 hover:text-white"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="ff-button w-full">DEPLOY TO VAULT</button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-2 px-2">
                    <h2 className="text-xl font-bold tracking-tight">Active Operations</h2>
                    <div className="text-gray-500 text-xs font-mono">LIVE_FEED // SECURE</div>
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <Loader2 className="w-10 h-10 text-ff-orange animate-spin" />
                      <p className="text-gray-500 font-mono text-sm">DECRYPTING_DATA...</p>
                    </div>
                  ) : listings.length === 0 ? (
                    <div className="ff-glass rounded-2xl p-12 text-center">
                      <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500">The vault is currently empty.</p>
                      <button onClick={() => setIsAdding(true)} className="text-ff-orange mt-2 font-bold hover:underline">Secure your first ID</button>
                    </div>
                  ) : (
                    listings.map((listing) => (
                      <motion.div 
                        layout
                        key={listing.id}
                        className="ff-glass rounded-2xl overflow-hidden flex flex-col md:flex-row group"
                      >
                        <div className="md:w-48 h-48 md:h-auto overflow-hidden bg-black/40 relative">
                          <ImageSlider 
                            images={listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls : (listing.imageUrl ? [listing.imageUrl] : [])} 
                            title={listing.title} 
                            className="w-full h-full"
                          />
                        </div>
                        <div className="flex-1 p-6 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                               <h3 className="text-xl font-bold group-hover:text-ff-orange transition-colors">{listing.title}</h3>
                               <div className="flex items-center space-x-2">
                                 {listing.status === ListingStatus.SOLD && (!listing.vaultId || !listing.vaultPassword) && (
                                   <span className="animate-pulse bg-red-500/20 text-red-500 text-[8px] font-black uppercase px-2 py-1 rounded border border-red-500/30 flex items-center">
                                     <Lock className="w-2 h-2 mr-1" />
                                     Intel Missing
                                   </span>
                                 )}
                                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                                   listing.status === ListingStatus.AVAILABLE 
                                   ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                                   : 'bg-red-500/10 text-red-500 border-red-500/30'
                                 }`}>
                                   {listing.status.toUpperCase()}
                                 </span>
                               </div>
                             </div>
                            <p className="text-gray-400 text-sm line-clamp-2 mb-4">{listing.description}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {listing.features.map((f, i) => (
                                <span key={i} className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                                  {f}
                                </span>
                              ))}
                            </div>

                            {(listing.vaultId || listing.vaultPassword) ? (
                              <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-wrap gap-x-6 gap-y-2 mb-4 font-mono text-[10px]">
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-600 uppercase">ID:</span>
                                  <span className="text-white font-bold">{listing.vaultId || 'EMPTY'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-600 uppercase">PASS:</span>
                                  <span className="text-white font-bold">{listing.vaultPassword || 'EMPTY'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-600 uppercase">PLATFORM:</span>
                                  <span className="text-ff-orange font-bold">{listing.platform || 'FREE FIRE'}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 mb-4 text-center">
                                <p className="text-[10px] font-mono text-red-400/60 uppercase tracking-widest flex items-center justify-center">
                                  <Lock className="w-3 h-3 mr-2" />
                                  Secure Credentials Not Set
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center text-xl font-bold">
                              <span>₹{listing.price.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {(!listing.vaultId || !listing.vaultPassword) && (
                                <button 
                                  onClick={() => handleEdit(listing)}
                                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-ff-orange text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-ff-orange/20"
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>Deliver Intel</span>
                                </button>
                              )}
                              <button 
                                onClick={() => handleEdit(listing)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                title="Edit ID"
                              >
                                <Edit3 className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => toggleSoldStatus(listing.id, listing.status)}
                                title={listing.status === ListingStatus.AVAILABLE ? "Mark as Sold" : "Make Available"}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-ff-orange"
                              >
                                <CheckCircle className={`w-5 h-5 ${listing.status === ListingStatus.SOLD ? 'text-ff-orange' : ''}`} />
                              </button>
                              <button 
                                onClick={() => handleDelete(listing.id)}
                                className="p-2 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
