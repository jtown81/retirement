'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';

/**
 * User menu dropdown component
 *
 * Features:
 * - Avatar with initials from user email
 * - Dropdown menu with profile, settings, and sign-out options
 * - Loading state during sign-out
 * - Dark mode support
 *
 * Phase 4.1: Basic sign-out functionality
 * Phase 4.2: Link to subscription management (RevenueCat)
 * Phase 4.3: Link to account settings and preferences
 */
export function UserMenu() {
  const { user, isSignedIn, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  if (!isSignedIn || !user) {
    return null;
  }

  // Get user initials from email
  const email = user.email || 'User';
  const initials = email
    .split('@')[0]
    .split(/[._-]/)
    .map((part) => part[0].toUpperCase())
    .join('')
    .slice(0, 2);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      setIsOpen(false);
    } catch (err) {
      console.error('Sign-out error:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 transition-colors"
        title={email}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-700 z-10">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{email}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Signed in</p>
          </div>

          {/* Menu Items */}
          <button
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <User className="h-4 w-4" />
            Profile
          </button>

          <button
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>

          <div className="border-t border-slate-200 dark:border-slate-700" />

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
