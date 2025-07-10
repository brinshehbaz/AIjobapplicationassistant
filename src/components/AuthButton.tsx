import React from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import type { User as UserType } from '../types';

interface AuthButtonProps {
  user: UserType | null;
  onSignIn: () => void;
  onSignOut: () => void;
  loading?: boolean;
}

export function AuthButton({ user, onSignIn, onSignOut, loading }: AuthButtonProps) {
  if (loading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
      >
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        Connecting...
      </button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg">
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <User className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">{user.name}</span>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onSignIn}
      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
    >
      <LogIn className="w-4 h-4" />
      Sign in with Google
    </button>
  );
}