import { User as SupabaseUser } from '@supabase/supabase-js';

interface SessionData {
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    user: SupabaseUser;
  } | null;
  user: SupabaseUser | null;
}

interface SignUpData {
  user: SupabaseUser | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  } | null;
}

/**
 * Alternative auth service that uses your API as a proxy to avoid CORS issues
 */
export const localAuthService = {
  signUp: async (email: string, password: string, userData?: any) => {
    try {
      const response = await fetch('https://api.costudy.in/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          ...userData
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Local signup error:', error);
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const response = await fetch('https://api.costudy.in/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signin failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Local signin error:', error);
      throw error;
    }
  },

  getSession: async (): Promise<SessionData> => {
    try {
      // Try to get session from localStorage first
      const storedSession = localStorage.getItem('costudy_session');
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        
        // Check if session is still valid
        if (sessionData.expires_at && Date.now() < sessionData.expires_at * 1000) {
          return {
            session: sessionData,
            user: sessionData.user || null
          };
        } else {
          // Session expired, try to refresh
          return await localAuthService.refreshSession();
        }
      }
      
      return { session: null, user: null };
    } catch (error) {
      console.error('Get session error:', error);
      return { session: null, user: null };
    }
  },

  refreshSession: async (): Promise<SessionData> => {
    try {
      const storedSession = localStorage.getItem('costudy_session');
      if (!storedSession) {
        return { session: null, user: null };
      }
      
      const sessionData = JSON.parse(storedSession);
      const refreshToken = sessionData.refresh_token;
      
      if (!refreshToken) {
        return { session: null, user: null };
      }
      
      const response = await fetch('https://api.costudy.in/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        },
      });
      
      if (response.ok) {
        const newSession = await response.json();
        localStorage.setItem('costudy_session', JSON.stringify(newSession));
        return {
          session: newSession,
          user: newSession.user || null
        };
      } else {
        // Refresh failed, clear stored session
        localStorage.removeItem('costudy_session');
        return { session: null, user: null };
      }
    } catch (error) {
      console.error('Refresh session error:', error);
      localStorage.removeItem('costudy_session');
      return { session: null, user: null };
    }
  },

  signOut: async () => {
    try {
      // Clear local session storage
      localStorage.removeItem('costudy_session');
      
      // Optionally notify the API to invalidate the session
      try {
        await fetch('https://api.costudy.in/auth/signout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (apiError) {
        console.warn('API signout failed:', apiError);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
};