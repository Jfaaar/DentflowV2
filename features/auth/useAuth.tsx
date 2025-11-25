import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { authReducer, getInitialState } from './authSlice';
import { AuthState, LoginCredentials } from './types';
import { api } from '../../lib/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, getInitialState());

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // 1. Authenticate with Server
      const user = await api.auth.login(credentials);
      
      // 2. Persist Session Locally (so refreshing page doesn't log out)
      localStorage.setItem('dentflow_user', JSON.stringify(user));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Login failed');
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
    }
  };

  const logout = () => {
    localStorage.removeItem('dentflow_user');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};