import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/db';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export const RegisterPage: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!nickname || !email || !password) throw new Error('All fields are required');
      if (password.length < 6) throw new Error('Password too short (min 6)');

      const user = await userService.register({ nickname, email, password, avatar: '', banner: '' });
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
        <h1 className="text-3xl text-center font-vt323 text-[#55ff55] mb-6">REGISTER</h1>
        {error && (
          <div className="bg-[#aa0000] text-white p-2 mb-4 font-vt323 text-center border-2 border-[#550000]">
            {error}
          </div>
        )}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <Input
            label="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="mt-4" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </Button>
        </form>
        <div className="mt-4 text-center font-vt323 text-gray-400">
          Already registered?{' '}
          <Link to="/login" className="text-[#55ff55] hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};
