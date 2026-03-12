import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/db';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export const LoginPage: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await userService.login(nickname, password);
      login(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="bg-[#2c2c2c] border-4 border-[#181818] p-8 w-full max-w-md shadow-lg">
        <h1 className="text-3xl text-center font-vt323 text-[#55ff55] mb-6">LOGIN</h1>
        {error && (
          <div className="bg-[#aa0000] text-white p-2 mb-4 font-vt323 text-center border-2 border-[#550000]">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            label="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="mt-4" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <div className="mt-4 text-center font-vt323 text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#55ff55] hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};
