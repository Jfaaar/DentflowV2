
import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Activity, AlertCircle } from 'lucide-react';
import { useAuth } from './useAuth';

export const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('assistant@clinic.com');
  const [password, setPassword] = useState('password');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md border-surface-100 shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary-600 p-3 rounded-2xl text-white mb-4 shadow-lg shadow-primary-200/50">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Welcome Back</h1>
          <p className="text-surface-500 text-sm mt-1">Sign in to manage your clinic</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            label="Email Address"
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="assistant@clinic.com"
          />
          <Input 
            label="Password"
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full py-3 text-base shadow-lg shadow-primary-200" 
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-xs text-surface-400 bg-surface-50 p-2 rounded-lg border border-surface-100">
            <p className="font-semibold mb-1">Demo Credentials:</p>
            <p>Email: assistant@clinic.com</p>
            <p>Password: password</p>
        </div>
      </Card>
    </div>
  );
};