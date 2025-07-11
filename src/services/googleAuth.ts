import { GOOGLE_CONFIG } from '../config/constants';
import type { User, GoogleAuthResponse } from '../types';

class GoogleAuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('google_access_token');
    this.refreshToken = localStorage.getItem('google_refresh_token');
    const expiry = localStorage.getItem('google_token_expiry');
    this.tokenExpiry = expiry ? parseInt(expiry) : null;
  }

  private saveTokensToStorage(tokens: GoogleAuthResponse) {
    this.accessToken = tokens.access_token;
    if (tokens.refresh_token) {
      this.refreshToken = tokens.refresh_token;
    }
    this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);

    localStorage.setItem('google_access_token', tokens.access_token);
    if (tokens.refresh_token) {
      localStorage.setItem('google_refresh_token', tokens.refresh_token);
    }
    localStorage.setItem('google_token_expiry', this.tokenExpiry.toString());
  }

  private clearTokensFromStorage() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    localStorage.removeItem('google_token_expiry');
  }

  async signIn(): Promise<User> {
    return new Promise((resolve, reject) => {
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CONFIG.CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(GOOGLE_CONFIG.REDIRECT_URI)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(GOOGLE_CONFIG.SCOPES)}&` +
        `access_type=offline&` +
        `prompt=consent`;

      let checkClosedInterval: NodeJS.Timeout;
      let popupBlockedTimeout: NodeJS.Timeout;
      let authCompleted = false;

      const messageHandler = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS' && event.data.code) {
          authCompleted = true;
          cleanup();
          popup.close();
          
          try {
            const user = await this.handleAuthCode(event.data.code);
            resolve(user);
          } catch (error) {
            reject(error);
          }
        }
        
        else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          authCompleted = true;
          cleanup();
          popup.close();
          reject(new Error(event.data.error || 'Google authentication failed'));
        }
      };

      const cleanup = () => {
        if (checkClosedInterval) clearInterval(checkClosedInterval);
        if (popupBlockedTimeout) clearTimeout(popupBlockedTimeout);
        window.removeEventListener('message', messageHandler);
      };

      // Try popup first
      const popup = window.open(
        authUrl, 
        'google-auth', 
        'width=500,height=600,left=' + (window.screen.width / 2 - 250) + ',top=' + (window.screen.height / 2 - 300) + ',scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        // Fallback to full-page redirect if popup fails
        cleanup();
        window.location.href = authUrl;
        return;
      }

      // Check if popup was blocked (some browsers allow creation but immediately close)
      popupBlockedTimeout = setTimeout(() => {
        if (popup.closed) {
          // Popup was blocked, redirect instead
          cleanup();
          window.location.href = authUrl;
          return;
        }
      }, 100);

      checkClosedInterval = setInterval(() => {
        if (popup.closed && !authCompleted) {
          cleanup();
          reject(new Error('Authentication window was closed'));
        }
      }, 1000);

      window.addEventListener('message', messageHandler);
    });
  }

  private async handleAuthCode(code: string): Promise<User> {
    const tokens = await this.exchangeCodeForTokens(code);
    this.saveTokensToStorage(tokens);
    return await this.getUserInfo();
  }

  private async exchangeCodeForTokens(code: string): Promise<GoogleAuthResponse> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CONFIG.CLIENT_ID,
        code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_CONFIG.REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    return response.json();
  }

  async getUserInfo(): Promise<User> {
    const token = await this.getValidAccessToken();
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  }

  async getValidAccessToken(): Promise<string> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
      if (this.refreshToken) {
        await this.refreshAccessToken();
      } else {
        throw new Error('Token expired and no refresh token available');
      }
    }

    return this.accessToken;
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CONFIG.CLIENT_ID,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const tokens = await response.json();
    this.saveTokensToStorage(tokens);
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && (!this.tokenExpiry || Date.now() < this.tokenExpiry);
  }

  signOut(): void {
    this.clearTokensFromStorage();
  }

  async handleAuthCode(code: string): Promise<User> {
    const tokens = await this.exchangeCodeForTokens(code);
    this.saveTokensToStorage(tokens);
    return await this.getUserInfo();
  }
}

export const googleAuthService = new GoogleAuthService();

// Handle OAuth callback
if (window.location.pathname === '/auth/callback' && window.location.search.includes('code=')) {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');
  
  if (error && window.opener) {
    window.opener.postMessage({ 
      type: 'GOOGLE_AUTH_ERROR', 
      error: `OAuth error: ${error}` 
    }, window.location.origin);
    window.close();
  } else if (code && window.opener) {
    window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', code }, window.location.origin);
    window.close();
  } else if (code) {
    // Handle direct callback (not popup)
    window.location.href = `/?code=${code}`;
  } else if (error) {
    // Handle direct callback error
    window.location.href = `/?error=${error}`;
  }
}