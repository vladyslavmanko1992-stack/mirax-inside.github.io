import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Project, User } from '../types';
import { projectService, userService } from '../services/db';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useNavigate, Link } from 'react-router-dom';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'moderation' | 'projects' | 'users'>('moderation');
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // God Mode Inputs
  const [editStatsId, setEditStatsId] = useState<string | null>(null);
  const [newViews, setNewViews] = useState(0);
  const [newDownloads, setNewDownloads] = useState(0);
  const [newLikes, setNewLikes] = useState(0);
  const [newDislikes, setNewDislikes] = useState(0);
  
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [newSubs, setNewSubs] = useState(0);

  // Ban modal
  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [banDuration, setBanDuration] = useState(1);
  const [banUnit, setBanUnit] = useState<'hours' | 'days'>('days');
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      navigate('/');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const allProjects = await projectService.getAll();
      setProjects(allProjects || []);
      const allUsers = await userService.getAll();
      setUsers(allUsers || []);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    await projectService.update(id, { status: 'approved', rejectionReason: '' });
    await loadData();
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Rejection reason?');
    if (reason) {
      await projectService.update(id, { status: 'rejected', rejectionReason: reason });
      await loadData();
    }
  };

  const handleRecommend = async (id: string, current: boolean) => {
    await projectService.update(id, { isRecommended: !current });
    await loadData();
  };

  const handleUpdateStats = async () => {
    if (!editStatsId) return;
    const p = projects.find(p => p.id === editStatsId);
    if (!p) return;

    // Build likes array to match desired count
    const currentLikes = (p.likes || []);
    let updatedLikes = [...currentLikes];
    if (newLikes > currentLikes.length) {
      for (let i = 0; i < newLikes - currentLikes.length; i++) {
        updatedLikes.push('admin-like-' + Math.random().toString(36).substr(2, 9));
      }
    } else if (newLikes < currentLikes.length) {
      updatedLikes = updatedLikes.slice(0, newLikes);
    }

    // Build dislikes array to match desired count
    const currentDislikes = (p.dislikes || []);
    let updatedDislikes = [...currentDislikes];
    if (newDislikes > currentDislikes.length) {
      for (let i = 0; i < newDislikes - currentDislikes.length; i++) {
        updatedDislikes.push('admin-dislike-' + Math.random().toString(36).substr(2, 9));
      }
    } else if (newDislikes < currentDislikes.length) {
      updatedDislikes = updatedDislikes.slice(0, newDislikes);
    }

    await projectService.update(editStatsId, {
      views: newViews,
      downloads: newDownloads,
      likes: updatedLikes,
      dislikes: updatedDislikes,
    });
    setEditStatsId(null);
    await loadData();
  };

  const handleSendToModeration = async (id: string) => {
    if (confirm('Send this project back to moderation? Its status will become "pending".')) {
      await projectService.update(id, { status: 'pending', rejectionReason: '' });
      await loadData();
    }
  };

  const handleUpdateUser = async () => {
    if (!editUserId) return;
    const u = users.find(u => u && u.id === editUserId);
    if (!u) return;
    
    const currentCount = (u.subscribers || []).length;
    const diff = newSubs - currentCount;
    
    let newSubsList = [...(u.subscribers || [])];
    
    if (diff > 0) {
      for(let i = 0; i < diff; i++) {
        newSubsList.push('fake-sub-' + Math.random());
      }
    } else if (diff < 0) {
      newSubsList = newSubsList.slice(0, newSubs);
    }
    
    await userService.update(editUserId, { subscribers: newSubsList });
    setEditUserId(null);
    await loadData();
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Delete this project?')) {
      await projectService.delete(id);
      await loadData();
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Delete this user and ALL their projects/comments? This cannot be undone!')) {
      await userService.delete(id);
      await loadData();
    }
  };

  const handleBanUser = async () => {
    if (!banUserId || !banReason.trim()) return;
    await userService.ban(banUserId, banDuration, banUnit, banReason);
    setBanUserId(null);
    setBanDuration(1);
    setBanUnit('days');
    setBanReason('');
    await loadData();
  };

  const handleUnbanUser = async (id: string) => {
    await userService.unban(id);
    await loadData();
  };

  const handleMakeAdmin = async (id: string) => {
    if (confirm('Give this user admin rights?')) {
      await userService.makeAdmin(id);
      await loadData();
    }
  };

  const handleRemoveAdmin = async (id: string) => {
    if (confirm('Remove admin rights from this user?')) {
      await userService.removeAdmin(id);
      await loadData();
    }
  };

  const handleMakeModerator = async (id: string) => {
    if (confirm('Make this user a moderator?')) {
      await userService.makeModerator(id);
      await loadData();
    }
  };

  const handleRemoveModerator = async (id: string) => {
    if (confirm('Remove moderator rights from this user?')) {
      await userService.removeModerator(id);
      await loadData();
    }
  };

  const isUserBanned = (u: User): boolean => {
    if (!u.bannedUntil) return false;
    return new Date(u.bannedUntil) > new Date();
  };

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  if (!user || (!isAdmin && !isModerator)) return null;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-vt323 text-[#aa0000] mb-6 uppercase">Admin Panel</h1>
      
      <div className="flex gap-4 mb-6 border-b border-[#444] pb-2">
        <Button variant={activeTab === 'moderation' ? 'primary' : 'secondary'} onClick={() => setActiveTab('moderation')}>
          Moderation
        </Button>
        {isAdmin && (
          <Button variant={activeTab === 'projects' ? 'primary' : 'secondary'} onClick={() => setActiveTab('projects')}>
            All Projects (God Mode)
          </Button>
        )}
        {isAdmin && (
          <Button variant={activeTab === 'users' ? 'primary' : 'secondary'} onClick={() => setActiveTab('users')}>
            Users (God Mode)
          </Button>
        )}
      </div>

      {loading && <div className="text-gray-500 font-vt323 text-xl animate-pulse">Loading...</div>}

      {!loading && activeTab === 'moderation' && (
        <div className="space-y-4">
          <h2 className="text-xl font-vt323 text-white">Pending Projects</h2>
          {projects.filter(p => p && p.status === 'pending').length === 0 && (
            <p className="text-gray-500 font-vt323">No pending projects.</p>
          )}
          
          {projects.filter(p => p && p.status === 'pending').map(p => p && (
            <div key={p.id} className="bg-[#2c2c2c] border border-[#555] p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-vt323 text-[#55ff55]">
                  {p.title} <span className="text-gray-400 text-sm">by {p.authorName}</span>
                </h3>
                <p className="text-gray-400 text-sm font-vt323">{(p.description || '').substring(0, 100)}...</p>
                <p className="text-gray-500 text-xs font-vt323 mt-1">
                  Category: {p.category} | Core: {p.core} | MC: {p.mcVersion}
                </p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-2">
                  <Button size="sm" variant="success" onClick={() => handleApprove(p.id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleReject(p.id)}>
                    Reject
                  </Button>
                </div>
                <a href={`/project/${p.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs font-vt323 hover:underline">
                  View Project
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && activeTab === 'projects' && (
        <div className="grid grid-cols-1 gap-4">
          {projects.map(p => p && (
            <div key={p.id} className="bg-[#2c2c2c] border border-[#555] p-2 flex justify-between items-center">
              <div className="flex-1">
                <span className="font-vt323 text-[#55ff55]">{p.title}</span>
                <span className={`ml-2 text-xs px-1 rounded ${p.status === 'approved' ? 'bg-green-800' : 'bg-red-800'} text-white`}>
                  {p.status}
                </span>
                {p.isRecommended && <span className="ml-2 text-xs px-1 bg-yellow-600 text-black">RECOMMENDED</span>}
              </div>
              
              <div className="flex gap-4 items-center">
                <div className="text-gray-400 font-vt323 text-sm">
                  Views: {p.views || 0} | DLs: {p.downloads || 0} | Likes: {(p.likes || []).length} | Dislikes: {(p.dislikes || []).length}
                </div>
                
                <Button 
                  size="sm" 
                  onClick={() => { 
                    setEditStatsId(p.id); 
                    setNewViews(p.views || 0); 
                    setNewDownloads(p.downloads || 0); 
                    setNewLikes((p.likes || []).length);
                    setNewDislikes((p.dislikes || []).length);
                  }}
                >
                  Edit Stats
                </Button>
                {p.status !== 'pending' && (
                  <Button 
                    size="sm" 
                    variant="primary" 
                    onClick={() => handleSendToModeration(p.id)}
                  >
                    To Moderation
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant={p.isRecommended ? 'danger' : 'success'} 
                  onClick={() => handleRecommend(p.id, p.isRecommended || false)}
                >
                  {p.isRecommended ? 'Un-Recommend' : 'Recommend'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDeleteProject(p.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
          
          {editStatsId && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="bg-[#2c2c2c] p-6 border-2 border-white w-96">
                <h3 className="text-xl font-vt323 text-white mb-4">Edit Stats</h3>
                <div className="flex flex-col gap-4">
                  <Input 
                    label="Views" 
                    type="number" 
                    value={newViews} 
                    onChange={e => setNewViews(Number(e.target.value))} 
                  />
                  <Input 
                    label="Downloads" 
                    type="number" 
                    value={newDownloads} 
                    onChange={e => setNewDownloads(Number(e.target.value))} 
                  />
                  <Input 
                    label="Likes" 
                    type="number" 
                    value={newLikes} 
                    onChange={e => setNewLikes(Math.max(0, Number(e.target.value)))} 
                  />
                  <Input 
                    label="Dislikes" 
                    type="number" 
                    value={newDislikes} 
                    onChange={e => setNewDislikes(Math.max(0, Number(e.target.value)))} 
                  />
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleUpdateStats}>Save</Button>
                    <Button variant="secondary" onClick={() => setEditStatsId(null)}>Cancel</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'users' && (
        <div className="grid grid-cols-1 gap-4">
          {users.map(u => u && (
            <div key={u.id} className="bg-[#2c2c2c] border border-[#555] p-3 flex justify-between items-center">
              <div>
                <Link to={`/profile/${u.id}`} className="font-vt323 text-[#55ff55] hover:underline">{u.nickname || 'Unknown'}</Link>
                <span className="ml-2 text-gray-400 text-xs">{u.email}</span>
                <span className="ml-2 text-gray-500 text-xs">Subs: {(u.subscribers || []).length}</span>
                {isUserBanned(u) && (
                  <span className="ml-2 text-xs px-1 bg-red-800 text-white rounded">
                    BANNED until {new Date(u.bannedUntil!).toLocaleDateString()} — {u.banReason}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => { 
                    setEditUserId(u.id); 
                    setNewSubs((u.subscribers || []).length); 
                  }}
                >
                  Edit Subs
                </Button>
                {isUserBanned(u) ? (
                  <Button size="sm" variant="success" onClick={() => handleUnbanUser(u.id)}>
                    Unban
                  </Button>
                ) : (
                  u.role !== 'admin' && (
                    <Button size="sm" variant="danger" onClick={() => { setBanUserId(u.id); setBanDuration(1); setBanUnit('days'); setBanReason(''); }}>
                      Ban
                    </Button>
                  )
                )}
                {u.id !== 'admin-1' && (
                  u.role === 'admin' ? (
                    <Button size="sm" variant="secondary" onClick={() => handleRemoveAdmin(u.id)}>
                      Remove Admin
                    </Button>
                  ) : u.role === 'moderator' ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => handleRemoveModerator(u.id)}>
                        Remove Moderator
                      </Button>
                      <Button size="sm" variant="success" onClick={() => handleMakeAdmin(u.id)}>
                        Make Admin
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="success" onClick={() => handleMakeModerator(u.id)}>
                        Make Moderator
                      </Button>
                      <Button size="sm" variant="success" onClick={() => handleMakeAdmin(u.id)}>
                        Make Admin
                      </Button>
                    </>
                  )
                )}
                {u.role !== 'admin' && u.role !== 'moderator' && (
                  <Button size="sm" variant="danger" onClick={() => handleDeleteUser(u.id)}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}

          {editUserId && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="bg-[#2c2c2c] p-6 border-2 border-white w-96">
                <h3 className="text-xl font-vt323 text-white mb-4">Edit Subscribers</h3>
                <div className="flex flex-col gap-4">
                  <Input 
                    label="Subscriber Count" 
                    type="number" 
                    value={newSubs} 
                    onChange={e => setNewSubs(Number(e.target.value))} 
                  />
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleUpdateUser}>Save</Button>
                    <Button variant="secondary" onClick={() => setEditUserId(null)}>Cancel</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {banUserId && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="bg-[#2c2c2c] p-6 border-2 border-red-600 w-96">
                <h3 className="text-xl font-vt323 text-[#aa0000] mb-4">Ban User</h3>
                <p className="text-gray-400 font-vt323 mb-4">
                  Banning: {users.find(u => u.id === banUserId)?.nickname || 'Unknown'}
                </p>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input 
                        label="Duration" 
                        type="number" 
                        value={banDuration} 
                        onChange={e => setBanDuration(Math.max(1, Number(e.target.value)))} 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-gray-300 uppercase text-sm font-vt323 block mb-1">Unit</label>
                      <select
                        className="w-full bg-[#3a3a3a] border-2 border-[#1e1e1e] text-white p-2 font-vt323 focus:outline-none focus:border-[#a0a0a0]"
                        value={banUnit}
                        onChange={e => setBanUnit(e.target.value as 'hours' | 'days')}
                      >
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-300 uppercase text-sm font-vt323">Ban Reason</label>
                    <textarea 
                      className="bg-[#3a3a3a] border-2 border-[#1e1e1e] text-white p-2 font-vt323 h-24 focus:outline-none focus:border-[#a0a0a0]"
                      value={banReason}
                      onChange={e => setBanReason(e.target.value)}
                      placeholder="Enter ban reason..."
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="danger" onClick={handleBanUser} disabled={!banReason.trim()}>Ban</Button>
                    <Button variant="secondary" onClick={() => setBanUserId(null)}>Cancel</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
