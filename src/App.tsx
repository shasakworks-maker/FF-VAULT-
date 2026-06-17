/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, isUserAdmin, ensureUserProfile } from './lib/firebase';
import LoginPage from './components/LoginPage';
import AdminPanel from './components/AdminPanel';
import WalletPage from './components/WalletPage';
import Marketplace from './components/Marketplace';
import SupportPage from './components/SupportPage';
import Notifications from './components/Notifications';
import ProfilePage from './components/ProfilePage';
import Navigation from './components/Navigation';
import SplashScreen from './components/SplashScreen';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsAdmin(isUserAdmin(currentUser));
        // Background ensure profile
        ensureUserProfile(currentUser).catch(console.error);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Safety timeout: if auth takes longer than 10 seconds, stop loading
    const authTimeout = setTimeout(() => {
      setLoading(currentLoading => {
        if (currentLoading) {
          console.warn('Auth state check timed out');
          return false;
        }
        return currentLoading;
      });
    }, 10000);
    
    return () => {
      unsubscribe();
      clearTimeout(splashTimer);
      clearTimeout(authTimeout);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>

      {!loading && (
        <Router>
          <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to={isAdmin ? "/admin" : "/marketplace"} replace /> : <LoginPage />} 
        />
        
        {/* Authenticated Routes with Sidebar */}
        <Route element={user ? <Navigation /> : <Navigate to="/login" replace />}>
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route 
            path="/admin" 
            element={isAdmin ? <AdminPanel /> : <Navigate to="/marketplace" replace />} 
          />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )}
</>
);
}
