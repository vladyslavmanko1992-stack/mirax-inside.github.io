import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { LogOut, User as UserIcon, ShieldCheck, PlusSquare, Bell } from 'lucide-react';
import { notificationService } from '../services/db';
import { Notification } from '../types';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const unsub = notificationService.onUserNotifications(user.id, (notifications: Notification[]) => {
      setUnreadCount(notifications.filter(n => !n.read).length);
    });
    return () => unsub();
  }, [user]);

  return (
    <header className="bg-[#2c2c2c] border-b-4 border-[#181818] p-4 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="text-3xl font-bold text-[#aaaaaa] font-vt323 tracking-tighter drop-shadow-[2px_2px_0px_#000]">
        MiraX<span className="text-[#55ff55]">-Inside</span>
      </Link>

      <nav className="flex items-center gap-6">
        <Link to="/" className="text-gray-300 hover:text-white font-vt323 text-xl uppercase">Home</Link>
        <Link to="/rules" className="text-gray-300 hover:text-white font-vt323 text-xl uppercase">Rules</Link>
        
        {user ? (
          <div className="flex items-center gap-4">
             <Button size="sm" variant="primary" onClick={() => navigate('/submit')}>
                <PlusSquare size={16} /> Submit Project
             </Button>

             {(user.role === 'admin' || user.role === 'moderator') && (
                <Button size="sm" variant="danger" onClick={() => navigate('/admin')}>
                   <ShieldCheck size={16} /> {user.role === 'admin' ? 'Admin' : 'Moderation'}
                </Button>
             )}

             <button
               onClick={() => navigate('/notifications')}
               className="relative text-gray-300 hover:text-white p-1"
               title="Notifications"
             >
               <Bell size={22} />
               {unreadCount > 0 && (
                 <span className="absolute -top-1 -right-1 bg-[#aa0000] text-white text-xs font-vt323 w-5 h-5 flex items-center justify-center rounded-full border border-black">
                   {unreadCount > 9 ? '9+' : unreadCount}
                 </span>
               )}
             </button>
            
            <Link to={`/profile/${user.id}`} className="flex items-center gap-2 text-white hover:text-[#55ff55]">
              <div className="w-8 h-8 bg-gray-600 rounded-sm overflow-hidden border-2 border-black">
                 {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" /> : <UserIcon className="p-1" />}
              </div>
              <span className="font-vt323 text-lg">{user.nickname}</span>
            </Link>

            <Button size="sm" variant="secondary" onClick={() => { logout(); navigate('/'); }}>
              <LogOut size={16} />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => navigate('/login')}>Login</Button>
            <Button size="sm" variant="secondary" onClick={() => navigate('/register')}>Register</Button>
          </div>
        )}
      </nav>
    </header>
  );
};
