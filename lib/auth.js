'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, getLocalUsers, getUserProfile } from './supabaseClient';

const LOCAL_SESSION_KEY = 'sports_hub_local_session';

const AuthContext = createContext({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  setLocalSession: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper to fetch user profile row with auto-healing for missing profiles
  const fetchUserProfile = async (userId) => {
    return await getUserProfile(userId);
  };

  // Helper for setting authenticated local session
  const setLocalSession = useCallback((sessionUser, sessionProfile, rememberMe = true) => {
    setUser(sessionUser);
    setProfile(sessionProfile);
    setIsAdmin(Boolean(sessionProfile?.is_admin));
    if (typeof window !== 'undefined') {
      const now = Date.now();
      const sessionData = {
        token: `sess_${now}_${Math.random().toString(36).substring(2, 10)}`,
        user: sessionUser,
        profile: sessionProfile,
        createdAt: now,
        // Expire in 7 days if rememberMe is true, else 2 hours for session
        expiresAt: rememberMe ? (now + 7 * 24 * 60 * 60 * 1000) : (now + 2 * 60 * 60 * 1000),
        rememberMe: Boolean(rememberMe),
      };
      const serialized = JSON.stringify(sessionData);
      if (rememberMe) {
        localStorage.setItem(LOCAL_SESSION_KEY, serialized);
        sessionStorage.removeItem(LOCAL_SESSION_KEY);
      } else {
        sessionStorage.setItem(LOCAL_SESSION_KEY, serialized);
        localStorage.removeItem(LOCAL_SESSION_KEY);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      // 1. Supabase Mode
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user && mounted) {
            setUser(session.user);
            const userProfile = await fetchUserProfile(session.user.id);
            if (mounted) {
              setProfile(userProfile);
              setIsAdmin(Boolean(userProfile?.is_admin));
            }
          } else if (mounted) {
            setUser(null);
            setProfile(null);
            setIsAdmin(false);
          }
        } catch (err) {
          console.error('Error initializing Supabase auth:', err);
        } finally {
          if (mounted) setLoading(false);
        }
        return;
      }

      // 2. Local Starter Mode (with strict validation against stale/unauthenticated bypass)
      try {
        if (typeof window !== 'undefined') {
          const savedSession =
            sessionStorage.getItem(LOCAL_SESSION_KEY) ||
            localStorage.getItem(LOCAL_SESSION_KEY);

          if (savedSession) {
            const parsed = JSON.parse(savedSession);

            // Security check: Must have a valid session token and createdAt
            // (Rejects any legacy unverified or mock data left in localStorage)
            if (!parsed.token || !parsed.createdAt) {
              localStorage.removeItem(LOCAL_SESSION_KEY);
              sessionStorage.removeItem(LOCAL_SESSION_KEY);
              if (mounted) {
                setUser(null);
                setProfile(null);
                setIsAdmin(false);
              }
              return;
            }

            // Expiration check: Invalidate expired sessions
            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
              localStorage.removeItem(LOCAL_SESSION_KEY);
              sessionStorage.removeItem(LOCAL_SESSION_KEY);
              if (mounted) {
                setUser(null);
                setProfile(null);
                setIsAdmin(false);
              }
              return;
            }

            const localUsers = getLocalUsers();
            // Verify that the user still exists in the local user database
            const freshProfile = localUsers.find(
              (u) =>
                u.id === parsed.profile?.id ||
                u.usn?.toUpperCase() === parsed.profile?.usn?.toUpperCase() ||
                (parsed.profile?.email && u.email?.toLowerCase() === parsed.profile.email.toLowerCase())
            );

            if (freshProfile && mounted) {
              setUser(parsed.user);
              setProfile(freshProfile);
              setIsAdmin(Boolean(freshProfile.is_admin));
            } else if (mounted) {
              // User no longer exists; purge orphaned session
              localStorage.removeItem(LOCAL_SESSION_KEY);
              sessionStorage.removeItem(LOCAL_SESSION_KEY);
              setUser(null);
              setProfile(null);
              setIsAdmin(false);
            }
          }
        }
      } catch (err) {
        console.warn('Error reading local auth session:', err);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(LOCAL_SESSION_KEY);
          sessionStorage.removeItem(LOCAL_SESSION_KEY);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();

    // Listen for auth state changes if Supabase is active
    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;

          if (session?.user) {
            setUser(session.user);
            const userProfile = await fetchUserProfile(session.user.id);
            if (mounted) {
              setProfile(userProfile);
              setIsAdmin(Boolean(userProfile?.is_admin));
              setLoading(false);
            }
          } else {
            setUser(null);
            setProfile(null);
            setIsAdmin(false);
            setLoading(false);
          }
        }
      );

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const signOut = async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('SignOut error:', e);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      sessionStorage.removeItem(LOCAL_SESSION_KEY);
      localStorage.removeItem('sports_hub_auth_session');
      sessionStorage.removeItem('sports_hub_auth_session');
    }
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const refreshProfile = async () => {
    if (isSupabaseConfigured() && supabase && user?.id) {
      const updated = await fetchUserProfile(user.id);
      setProfile(updated);
      setIsAdmin(Boolean(updated?.is_admin));
    } else if (profile) {
      const localUsers = getLocalUsers();
      const updated = localUsers.find(
        (u) => u.id === profile.id || u.usn?.toUpperCase() === profile.usn?.toUpperCase()
      );
      if (updated) {
        setProfile(updated);
        setIsAdmin(Boolean(updated.is_admin));
        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem(LOCAL_SESSION_KEY) ? sessionStorage : localStorage;
          const prev = raw.getItem(LOCAL_SESSION_KEY);
          let prevParsed = {};
          try { prevParsed = JSON.parse(prev) || {}; } catch (e) {}
          raw.setItem(
            LOCAL_SESSION_KEY,
            JSON.stringify({
              ...prevParsed,
              user,
              profile: updated,
            })
          );
        }
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        signOut,
        refreshProfile,
        setLocalSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
