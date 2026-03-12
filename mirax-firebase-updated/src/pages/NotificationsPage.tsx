import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/db';
import { Notification } from '../types';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import { Bell, MessageSquare, CheckCheck } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const unsub = notificationService.onUserNotifications(user.id, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.id);
  };

  const handleDelete = async (id: string) => {
    await notificationService.delete(id);
  };

  if (!user) {
    return <div className="p-8 text-center text-white font-vt323 text-2xl">Please login to view notifications</div>;
  }

  if (loading) {
    return <div className="text-center mt-10 text-gray-500 font-vt323 text-xl animate-pulse">Loading notifications...</div>;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="bg-[#2c2c2c] border-4 border-[#181818] p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6 border-b border-[#444] pb-2">
          <h1 className="text-3xl font-vt323 text-[#55ff55] flex items-center gap-2">
            <Bell size={24} /> Notifications
            {unreadCount > 0 && (
              <span className="bg-[#aa0000] text-white text-sm px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h1>
          {unreadCount > 0 && (
            <Button size="sm" variant="secondary" onClick={handleMarkAllAsRead}>
              <CheckCheck size={16} /> Mark all as read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-10 text-gray-500 font-vt323 text-xl">
            No notifications yet
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 border-l-4 ${
                  n.read ? 'bg-[#2a2a2a] border-[#444]' : 'bg-[#333] border-[#55ff55]'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {n.type === 'comment' && (
                      <div className="flex items-start gap-2">
                        <MessageSquare size={16} className="text-[#55ff55] mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-gray-200 font-vt323">
                            <Link to={`/profile/${n.fromUserId}`} className="text-[#55ff55] hover:underline">
                              {n.fromUserName}
                            </Link>
                            {' '}commented on{' '}
                            <Link to={`/project/${n.projectId}`} className="text-[#55ff55] hover:underline">
                              {n.projectTitle}
                            </Link>
                          </p>
                          <p className="text-gray-400 font-vt323 text-sm mt-1">
                            "{n.commentPreview}{n.commentPreview.length >= 100 ? '...' : ''}"
                          </p>
                          <p className="text-gray-500 font-vt323 text-xs mt-1">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-2 flex-shrink-0">
                    {!n.read && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-gray-400 hover:text-[#55ff55] text-xs font-vt323"
                        title="Mark as read"
                      >
                        Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="text-gray-400 hover:text-[#aa0000] text-xs font-vt323"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
