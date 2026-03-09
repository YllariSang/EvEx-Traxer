// Simple authentication utility for single user
const AUTH_KEY = 'event_tracker_auth';
const USER_CREDENTIALS = {
  username: 'admin',
  password: 'admin123' // In production, this would be hashed
};

export const login = (username: string, password: string): boolean => {
  if (username === USER_CREDENTIALS.username && password === USER_CREDENTIALS.password) {
    localStorage.setItem(AUTH_KEY, 'authenticated');
    return true;
  }
  return false;
};

export const logout = (): void => {
  localStorage.removeItem(AUTH_KEY);
};

export const isAuthenticated = (): boolean => {
  return localStorage.getItem(AUTH_KEY) === 'authenticated';
};
