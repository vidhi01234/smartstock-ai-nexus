import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Lock, User } from 'lucide-react';
import { login, isAuthenticated } from '@/lib/store';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      login();
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Use admin / admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-md bg-secondary flex items-center justify-center mb-4 border border-border">
            <Brain size={24} strokeWidth={1.5} className="text-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-heading text-foreground">SmartStock AI</h1>
          <p className="text-xs text-muted-foreground mt-1">Warehouse Intelligence System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-xs text-muted-foreground uppercase tracking-widest">Username</Label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="pl-9 bg-secondary border-border text-foreground"
                placeholder="admin"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs text-muted-foreground uppercase tracking-widest">Password</Label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-9 bg-secondary border-border text-foreground"
                placeholder="••••••"
              />
            </div>
          </div>

          {error && <p className="text-xs text-status-expired">{error}</p>}

          <Button type="submit" className="w-full btn-industrial rounded-md text-sm font-medium">
            Access System
          </Button>
        </form>

        <p className="text-[10px] text-muted-foreground text-center mt-6">
          Default credentials: admin / admin
        </p>
      </div>
    </div>
  );
}
