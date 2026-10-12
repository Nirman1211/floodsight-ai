// Robust Authentication Service for FloodSight AI
// Features: Safe JSON parsing, backend SQLite synchronization, and persistent local DB fallback for zero downtime.

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  picture: string;
  token: string;
  provider?: string;
}

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Plain/hash for client mock fallback
  role: string;
  picture: string;
  provider: string;
}

const LOCAL_USERS_KEY = 'floodsight_users_db';
const ACTIVE_SESSION_KEY = 'floodsight_user';

// Seed default certified personnel
const DEFAULT_USERS: StoredUser[] = [
  {
    id: 'usr_cmd_01',
    name: 'Command Sentinel Alpha',
    email: 'commander@floodsight.org',
    passwordHash: 'Rescue2026!',
    role: 'Tactical Incident Commander',
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    provider: 'local',
  },
  {
    id: 'usr_res_02',
    name: 'Field Specialist Rescuer',
    email: 'test@rescuer.org',
    passwordHash: 'Secret123!',
    role: 'Search & Rescue Field Specialist',
    picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    provider: 'local',
  },
  {
    id: 'usr_nirman_03',
    name: 'Nirman Amrawanshi',
    email: 'nirman@floodsight.org',
    passwordHash: 'Nirman2026!',
    role: 'Lead Geospatial Commander',
    picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    provider: 'local',
  },
];

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return parsed;
  } catch {
    return DEFAULT_USERS;
  }
}

function saveStoredUsers(users: StoredUser[]) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Could not persist users to localStorage', e);
  }
}

// Helper to safely parse responses without crashing on HTML 502/504 errors
async function safeJsonFetch(url: string, options: RequestInit): Promise<{ ok: boolean; data: any; isJson: boolean }> {
  try {
    const resp = await fetch(url, options);
    const text = await resp.text();
    let data: any = null;
    let isJson = false;
    try {
      data = JSON.parse(text);
      isJson = true;
    } catch {
      // Returned HTML error page (e.g. 502 Bad Gateway or Cloudflare "An error occurred...")
      isJson = false;
      data = { detail: text.slice(0, 150) };
    }
    return { ok: resp.ok && isJson, data, isJson };
  } catch (err: any) {
    return { ok: false, data: { detail: err?.message || 'Network unreachable' }, isJson: false };
  }
}

export const authService = {
  // 1. Email + Password Login
  async login(email: string, pass: string): Promise<AuthUser> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // First attempt backend SQLite
    const backendResult = await safeJsonFetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
    });

    if (backendResult.ok && backendResult.data?.user) {
      const user: AuthUser = {
        id: backendResult.data.user.id,
        name: backendResult.data.user.name,
        email: backendResult.data.user.email,
        role: backendResult.data.user.role,
        picture: backendResult.data.user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        token: backendResult.data.token || `jwt_${Date.now()}`,
        provider: 'backend-sqlite',
      };
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(user));
      return user;
    }

    // Fallback to resilient Local Persistent DB
    const users = getStoredUsers();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!existing) {
      throw new Error(`Account not found for ${cleanEmail}. Please sign up first.`);
    }

    if (existing.passwordHash !== cleanPass) {
      throw new Error('Incorrect password. Please verify your credentials.');
    }

    const fallbackUser: AuthUser = {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      role: existing.role,
      picture: existing.picture,
      token: `jwt_local_${Date.now()}`,
      provider: 'persistent-db',
    };
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(fallbackUser));
    return fallbackUser;
  },

  // 2. Sign Up Registration
  async signup(name: string, email: string, pass: string, role: string): Promise<AuthUser> {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();
    const cleanRole = role.trim() || 'Tactical Incident Commander';

    // First attempt backend SQLite
    const backendResult = await safeJsonFetch('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        password: cleanPass,
        role: cleanRole,
      }),
    });

    if (backendResult.ok && backendResult.data?.user) {
      const user: AuthUser = {
        id: backendResult.data.user.id,
        name: backendResult.data.user.name,
        email: backendResult.data.user.email,
        role: backendResult.data.user.role,
        picture: backendResult.data.user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        token: backendResult.data.token || `jwt_${Date.now()}`,
        provider: 'backend-sqlite',
      };
      // Also sync to local DB
      const users = getStoredUsers();
      if (!users.some((u) => u.email.toLowerCase() === cleanEmail)) {
        users.push({
          id: user.id,
          name: user.name,
          email: user.email,
          passwordHash: cleanPass,
          role: user.role,
          picture: user.picture,
          provider: 'local',
        });
        saveStoredUsers(users);
      }
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(user));
      return user;
    }

    // Fallback to resilient Local Persistent DB
    const users = getStoredUsers();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error(`An account with email ${cleanEmail} already exists. Please log in.`);
    }

    const newUser: StoredUser = {
      id: `usr_${Date.now().toString(36)}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash: cleanPass,
      role: cleanRole,
      picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      provider: 'local',
    };

    users.push(newUser);
    saveStoredUsers(users);

    const authUser: AuthUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      picture: newUser.picture,
      token: `jwt_local_${Date.now()}`,
      provider: 'persistent-db',
    };
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(authUser));
    return authUser;
  },

  // 3. Continue with Google
  async googleAuth(profile?: { name?: string; email?: string; picture?: string; role?: string }): Promise<AuthUser> {
    const name = profile?.name?.trim() || 'Nirman Amrawanshi';
    const email = profile?.email?.trim().toLowerCase() || 'nirman.amrawanshi@disaster-response.org';
    const picture =
      profile?.picture ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';
    const role = profile?.role || 'Tactical Incident Commander';

    // First attempt backend SQLite
    const backendResult = await safeJsonFetch('/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, picture, role }),
    });

    if (backendResult.ok && backendResult.data?.user) {
      const user: AuthUser = {
        id: backendResult.data.user.id,
        name: backendResult.data.user.name,
        email: backendResult.data.user.email,
        role: backendResult.data.user.role,
        picture: backendResult.data.user.avatar_url || picture,
        token: backendResult.data.token || `jwt_google_${Date.now()}`,
        provider: 'google-oauth',
      };
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(user));
      return user;
    }

    // Fallback to resilient Local Persistent DB
    const users = getStoredUsers();
    let existing = users.find((u) => u.email.toLowerCase() === email);

    if (!existing) {
      existing = {
        id: `usr_g_${Date.now().toString(36)}`,
        name,
        email,
        passwordHash: 'GOOGLE_OAUTH_TOKEN',
        role,
        picture,
        provider: 'google',
      };
      users.push(existing);
      saveStoredUsers(users);
    }

    const authUser: AuthUser = {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      role: existing.role,
      picture: existing.picture,
      token: `jwt_google_${Date.now()}`,
      provider: 'google-oauth',
    };
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(authUser));
    return authUser;
  },

  getCurrentUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  },
};
