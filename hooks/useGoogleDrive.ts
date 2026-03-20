
import { useState, useEffect, useCallback } from 'react';
import { GoogleUser } from '../types';
import * as driveService from '../services/googleDriveService';

export const useGoogleDrive = () => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check for a saved session in local storage
    try {
      const storedUser = localStorage.getItem('google_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to parse stored Google user:", error);
      localStorage.removeItem('google_user');
    }
    setIsReady(true);
  }, []);
  
  const signIn = useCallback(async () => {
    try {
      const userData = await driveService.signIn();
      setUser(userData);
      localStorage.setItem('google_user', JSON.stringify(userData));
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Google Drive sign-in failed:", error);
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('google_user');
  }, []);

  return {
    user,
    isAuthenticated,
    isReady,
    signIn,
    signOut,
    openFile: driveService.openFile,
    saveNewFile: driveService.saveNewFile,
    updateFile: driveService.updateFile,
  };
};