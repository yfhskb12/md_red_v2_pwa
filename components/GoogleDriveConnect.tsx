
import React from 'react';
import { LogOut, Cloud } from 'lucide-react';
import { GoogleUser } from '../types';

interface GoogleDriveConnectProps {
  user: GoogleUser | null;
  onLogin: () => void;
  onLogout: () => void;
}

export const GoogleDriveConnect: React.FC<GoogleDriveConnectProps> = ({ user, onLogin, onLogout }) => {
  if (user) {
    return (
      <div className="flex items-center space-x-3 px-3 py-2 bg-background rounded-lg">
        <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{user.name}</p>
          <p className="text-xs text-text-muted truncate">{user.email}</p>
        </div>
        <button onClick={onLogout} title="Disconnect Google Drive" className="p-2 text-text-muted hover:text-danger-text hover:bg-danger-soft-bg rounded-md">
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  return (
    <button onClick={onLogin} className="w-full flex items-center justify-center space-x-2 py-2.5 bg-background hover:bg-background-tertiary rounded-lg transition-colors font-medium text-sm text-text-secondary hover:text-text-primary" title="Connect to Google Drive">
      <Cloud size={16} />
      <span>Connect to Google Drive</span>
    </button>
  );
};