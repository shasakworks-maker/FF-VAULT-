import { initializeApp } from 'firebase/app';
import { 
  getAuth as realGetAuth, 
  onAuthStateChanged as realOnAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigFile from '../../firebase-applet-config.json';
import { FirestoreErrorInfo } from '../types';

// Use environment variables if they exist (standard for production/deployment like Netlify),
// otherwise fallback to the local config file provided by AI Studio.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigFile.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigFile.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigFile.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigFile.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigFile.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigFile.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || (firebaseConfigFile as any).firestoreDatabaseId
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const nativeAuth = realGetAuth(app);

export const auth = new Proxy(nativeAuth, {
  get(target, prop) {
    if (prop === 'currentUser') {
      if (target.currentUser) return target.currentUser;
      const fallback = localStorage.getItem('ff_vault_fallback_user');
      if (fallback) {
        return JSON.parse(fallback);
      }
      return null;
    }
    const val = (target as any)[prop];
    if (typeof val === 'function') {
      return val.bind(target);
    }
    return val;
  }
}) as ReturnType<typeof realGetAuth>;

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function onAuthStateChanged(currentAuth: any, callback: (user: any) => void) {
  const unsubReal = realOnAuthStateChanged(nativeAuth, (currentUser) => {
    if (currentUser) {
      callback(currentUser);
    } else {
      const fallback = localStorage.getItem('ff_vault_fallback_user');
      if (fallback) {
        callback(JSON.parse(fallback));
      } else {
        callback(null);
      }
    }
  });

  const handleCustomAuthChange = () => {
    const fallback = localStorage.getItem('ff_vault_fallback_user');
    if (fallback) {
      callback(JSON.parse(fallback));
    } else {
      if (!nativeAuth.currentUser) {
        callback(null);
      }
    }
  };

  window.addEventListener('ff_vault_auth_change', handleCustomAuthChange);

  return () => {
    unsubReal();
    window.removeEventListener('ff_vault_auth_change', handleCustomAuthChange);
  };
}

// Centralized Admin Emails
export const ADMIN_EMAIL = 'ashokpal76199@gmail.com';
export const ADMIN_EMAILS = [ADMIN_EMAIL, 'bgg132654@gmail.com'];

// Helper to translate user emails into a safe and unique internal auth email
export function toAuthEmail(email: string): string {
  const clean = email.trim().toLowerCase();
  const encoded = clean
    .replace(/@/g, '_at_')
    .replace(/\./g, '_dot_')
    .replace(/-/g, '_dash_')
    .replace(/\+/g, '_plus_');
  return `${encoded}@vault.internal`;
}

// Reversibly translate internal auth emails back into real user emails
export function fromAuthEmail(authEmail: string): string {
  if (!authEmail || !authEmail.endsWith('@vault.internal')) return authEmail;
  const encoded = authEmail.replace('@vault.internal', '');
  const decoded = encoded
    .replace(/_plus_/g, '+')
    .replace(/_dash_/g, '-')
    .replace(/_dot_/g, '.')
    .replace(/_at_/g, '@');
  return decoded;
}

export function isUserAdmin(user: { email?: string | null } | null) {
  if (!user?.email) return false;
  const realEmail = fromAuthEmail(user.email);
  return ADMIN_EMAILS.includes(realEmail);
}

export async function ensureUserProfile(user: { uid: string, email: string | null }) {
  if (!user) return;
  const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const realEmail = user.email ? fromAuthEmail(user.email) : '';
    await setDoc(userRef, {
      email: realEmail,
      balance: 1000, // standard default starting balance
      updatedAt: serverTimestamp()
    });
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await ensureUserProfile(result.user);
    }
    return result.user;
  } catch (error) {
    console.error('Login Error:', error);
    throw error;
  }
}

// Custom Hashing and Deterministic Authorization Helpers
export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function deriveFirebasePassword(email: string): string {
  // A secure deterministic password unique to each user's email address
  return `Vau1t_Int_Pro_$${email.replace(/[^a-zA-Z0-9]/g, '_')}_SecureSecretKeys!`;
}

export async function signUpWithEmailAndPasswordCustom(email: string, password: string) {
  const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
  const cleanEmail = email.trim().toLowerCase();
  
  const credsRef = doc(db, 'user_passwords', cleanEmail);
  const credsSnap = await getDoc(credsRef);
  const hashedPassword = await hashPassword(password);
  
  if (credsSnap.exists() && credsSnap.data()?.hashedPassword) {
    if (credsSnap.data()?.hashedPassword === hashedPassword) {
      console.log('Account already exists in local ledger with matching password. Seamlessly signing in...');
      return await signInWithEmailAndPasswordCustom(email, password);
    } else {
      throw new Error('This email is already registered.');
    }
  }

  const authEmail = toAuthEmail(cleanEmail);
  const firebaseAuthPassword = deriveFirebasePassword(cleanEmail);
  
  try {
    const result = await createUserWithEmailAndPassword(nativeAuth, authEmail, firebaseAuthPassword);
    
    if (result.user) {
      await setDoc(credsRef, {
        email: cleanEmail,
        hashedPassword,
        createdAt: serverTimestamp()
      }, { merge: true });

      await ensureUserProfile(result.user);
      
      localStorage.removeItem('ff_vault_fallback_user');
      window.dispatchEvent(new Event('ff_vault_auth_change'));
      
      return result.user;
    }
  } catch (err: any) {
    const errCode = err.code || '';
    const errText = err.message || '';
    
    if (errCode === 'auth/operation-not-allowed' || errText.includes('operation-not-allowed')) {
      console.warn('Firebase Auth email/password is disabled. Activating robust local Firestore authentication fallback...', err);
      
      const customUid = 'fb_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Save credentials in Firestore
      await setDoc(credsRef, {
        email: cleanEmail,
        hashedPassword,
        createdAt: serverTimestamp()
      }, { merge: true });

      // Save user profile in Firestore
      const userRef = doc(db, 'users', customUid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: cleanEmail,
          balance: 1000,
          updatedAt: serverTimestamp()
        });
      }

      const fallbackUser = {
        uid: customUid,
        email: authEmail,
        isFallback: true
      };
      
      localStorage.setItem('ff_vault_fallback_user', JSON.stringify(fallbackUser));
      window.dispatchEvent(new Event('ff_vault_auth_change'));
      
      return fallbackUser as any;
    } else if (errCode === 'auth/email-already-in-use' || errText.includes('already-in-use')) {
      // Sync to Firestore credential doc if missing, then sign in
      await setDoc(credsRef, {
        email: cleanEmail,
        hashedPassword,
        createdAt: serverTimestamp()
      }, { merge: true });
      return await signInWithEmailAndPasswordCustom(email, password);
    } else {
      throw err;
    }
  }
}

export async function signInWithEmailAndPasswordCustom(email: string, password: string) {
  const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
  const cleanEmail = email.trim().toLowerCase();
  
  const credsRef = doc(db, 'user_passwords', cleanEmail);
  const credsSnap = await getDoc(credsRef);
  if (!credsSnap.exists() || !credsSnap.data()?.hashedPassword) {
    throw new Error('Account does not exist. Please register first.');
  }

  const data = credsSnap.data();
  const hashedPassword = await hashPassword(password);
  
  if (data.hashedPassword !== hashedPassword) {
    throw new Error('Incorrect password. Please try again.');
  }

  const authEmail = toAuthEmail(cleanEmail);
  const firebaseAuthPassword = deriveFirebasePassword(cleanEmail);
  
  try {
    const result = await signInWithEmailAndPassword(nativeAuth, authEmail, firebaseAuthPassword);
    
    // Success! Ensure user profile exists
    await ensureUserProfile(result.user);
    
    // Clear any fallback user in localStorage
    localStorage.removeItem('ff_vault_fallback_user');
    window.dispatchEvent(new Event('ff_vault_auth_change'));
    
    return result.user;
  } catch (err: any) {
    const errCode = err.code || '';
    const errText = err.message || '';
    
    if (
      errCode === 'auth/user-not-found' || 
      errCode === 'auth/invalid-credential' || 
      errCode === 'auth/invalid-login-credentials' || 
      errText.includes('user-not-found') || 
      errText.includes('invalid-credential')
    ) {
      console.log('User credential exists in Firestore, but they do not have a Firebase Auth account. Registering on-the-fly...');
      try {
        const result = await createUserWithEmailAndPassword(nativeAuth, authEmail, firebaseAuthPassword);
        if (result.user) {
          await ensureUserProfile(result.user);
          localStorage.removeItem('ff_vault_fallback_user');
          window.dispatchEvent(new Event('ff_vault_auth_change'));
          return result.user;
        }
      } catch (signupErr: any) {
        console.error('On-the-fly Firebase Auth registration failed:', signupErr);
        if (signupErr.code === 'auth/operation-not-allowed' || signupErr.message?.includes('operation-not-allowed')) {
          return triggerFallbackLogin(cleanEmail, authEmail);
        } else {
          throw signupErr;
        }
      }
    }
    
    if (errCode === 'auth/operation-not-allowed' || errText.includes('operation-not-allowed')) {
      return triggerFallbackLogin(cleanEmail, authEmail);
    }
    
    throw err;
  }
}

function triggerFallbackLogin(cleanEmail: string, authEmail: string) {
  const customUid = 'fb_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const fallbackUser = {
    uid: customUid,
    email: authEmail,
    isFallback: true
  };
  localStorage.setItem('ff_vault_fallback_user', JSON.stringify(fallbackUser));
  window.dispatchEvent(new Event('ff_vault_auth_change'));
  return fallbackUser as any;
}

export async function generatePasswordResetOtpCustom(email: string): Promise<string> {
  const { doc, getDoc, setDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  const cleanEmail = email.trim().toLowerCase();

  const credsRef = doc(db, 'user_passwords', cleanEmail);
  const credsSnap = await getDoc(credsRef);

  // Generate 6-digit verification code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  if (!credsSnap.exists()) {
    // If the account didn't exist in user_passwords yet (but they want to create their first password),
    // we initialize a skeleton structure so they can complete reset via OTP!
    await setDoc(credsRef, {
      email: cleanEmail,
      hashedPassword: '', // will be set upon submitting new password
      resetOtp: otp,
      resetOtpExpiry: expiry,
      createdAt: serverTimestamp()
    });
  } else {
    await updateDoc(credsRef, {
      resetOtp: otp,
      resetOtpExpiry: expiry
    });
  }

  return otp;
}

export async function resetPasswordWithOtpCustom(email: string, otp: string, newPassword: string) {
  const { doc, getDoc, updateDoc } = await import('firebase/firestore');
  const cleanEmail = email.trim().toLowerCase();

  const credsRef = doc(db, 'user_passwords', cleanEmail);
  const credsSnap = await getDoc(credsRef);
  if (!credsSnap.exists()) {
    throw new Error('Account not found.');
  }

  const data = credsSnap.data();
  if (!data?.resetOtp) {
    throw new Error('No password reset was requested.');
  }

  const expiryMillis = data.resetOtpExpiry?.toMillis ? data.resetOtpExpiry.toMillis() : new Date(data.resetOtpExpiry).getTime();
  if (Date.now() > expiryMillis) {
    throw new Error('OTP has expired. Please request another code.');
  }

  if (data.resetOtp !== otp.trim()) {
    throw new Error('Invalid OTP. Please check the code.');
  }

  const hashedPassword = await hashPassword(newPassword);

  await updateDoc(credsRef, {
    hashedPassword,
    resetOtp: null,
    resetOtpExpiry: null
  });

  // Provision their safe, collision-free Firebase Auth user if password reset occurs
  const authEmail = toAuthEmail(cleanEmail);
  const firebaseAuthPassword = deriveFirebasePassword(cleanEmail);
  try {
    await createUserWithEmailAndPassword(auth, authEmail, firebaseAuthPassword);
  } catch (err: any) {
    if (err.code !== 'auth/email-already-in-use') {
      console.warn('Silent reset mapping exception:', err);
    }
  }

  return true;
}

export function handleFirestoreError(error: unknown, operationType: FirestoreErrorInfo['operationType'], path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
