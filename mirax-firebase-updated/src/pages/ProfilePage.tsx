import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, Project } from '../types';
import { userService, projectService } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { ProjectCard } from '../components/ProjectCard';
import { UserPlus, UserMinus, PlusCircle, PenTool, LogOut, Edit3, ShieldAlert } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [banner, setBanner] = useState('');
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Stats
  const [views, setViews] = useState(0);
  const [downloads, setDownloads] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const u = await userService.getById(id);
        if (u) {
          setProfileUser(u);
          setAvatar(u.avatar || '');
          setBanner(u.banner || '');
          setNickname(u.nickname || '');
          setBio(u.bio || '');
          
          const allProjects = (await projectService.getAll()) || [];
          const userProjects = allProjects.filter(p => p && p.authorId === id);
          
          // Calculate stats
          setViews(userProjects.reduce((acc, p) => acc + (p.views || 0), 0));
          setDownloads(userProjects.reduce((acc, p) => acc + (p.downloads || 0), 0));
          
          // Check if profile user is banned
          const isBanned = u.bannedUntil && new Date(u.bannedUntil) > new Date();

          // Filter projects based on viewer
          if (currentUser?.id === id || currentUser?.role === 'admin') {
            setProjects(userProjects);
          } else if (isBanned) {
            // Banned users' projects are hidden from public
            setProjects([]);
          } else {
            // For public view: show approved projects, but hide pre-release with expired date and no download link
            setProjects(userProjects.filter(p => {
              if (p.status !== 'approved') return false;
              if (p.isPreRelease && p.releaseDate && new Date(p.releaseDate) <= new Date() && !p.downloadLink) {
                return false;
              }
              return true;
            }));
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [id, currentUser]);

  const handleSubscribe = async () => {
    if (!profileUser || !currentUser) return;
    const currentSubs = profileUser.subscribers || [];
    const isSubbed = currentSubs.includes(currentUser.id);
    let newSubs = [...currentSubs];
    
    if (isSubbed) {
      newSubs = newSubs.filter(sid => sid !== currentUser.id);
    } else {
      newSubs.push(currentUser.id);
    }
    
    await userService.update(profileUser.id, { subscribers: newSubs });
    setProfileUser({ ...profileUser, subscribers: newSubs });
  };

  const handleSaveProfile = async () => {
    if (!profileUser) return;
    setSaving(true);
    setNicknameError('');
    try {
      if (nickname.trim() !== profileUser.nickname) {
        await userService.changeNickname(profileUser.id, nickname.trim());
      }
      await userService.update(profileUser.id, { avatar, banner, bio });
      setProfileUser({ ...profileUser, avatar, banner, bio, nickname: nickname.trim() });
      setIsEditing(false);
    } catch (err: any) {
      if (err.message === 'Nickname taken') {
        setNicknameError('This nickname is already taken');
      } else {
        console.error("Error saving profile:", err);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setBanner(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div className="text-white text-center mt-10 font-vt323 text-2xl">Loading profile...</div>;
  if (!profileUser) return <div className="text-white text-center mt-10 font-vt323 text-2xl">User not found</div>;

  const isOwnProfile = currentUser?.id === profileUser.id;
  const isSubscribed = currentUser && (profileUser.subscribers || []).includes(currentUser.id);

  return (
    <div className="pb-20">
      {/* Banner */}
      <div className="h-64 w-full bg-[#111] relative overflow-hidden border-b-4 border-[#181818]">
        {isEditing ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <input type="file" onChange={handleBannerUpload} className="text-white" accept="image/*" />
          </div>
        ) : null}
        
        {banner ? (
          <img src={banner} className="w-full h-full object-cover" alt="banner" />
        ) : (
          <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/dirt.png')] bg-[#3e2723]"></div>
        )}
        
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#181818] to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 relative -mt-16 flex flex-col md:flex-row items-end md:items-start gap-6">
        {/* Avatar */}
        <div className="relative w-32 h-32 md:w-48 md:h-48 flex-shrink-0">
          <div className="w-full h-full bg-[#333] border-4 border-[#181818] overflow-hidden shadow-lg">
            {avatar ? (
              <img src={avatar} className="w-full h-full object-cover" alt="avatar" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 font-vt323 text-4xl">
                {profileUser.nickname?.[0] || '?'}
              </div>
            )}
          </div>
          {isEditing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <input type="file" onChange={handleAvatarUpload} className="w-20 text-xs text-white" accept="image/*" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-white pt-4 md:pt-16">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-vt323 drop-shadow-[2px_2px_0px_#000]">{profileUser.nickname || 'Unknown'}</h1>
            <span className="bg-[#555] px-2 py-0.5 text-xs rounded border border-[#777] font-vt323 uppercase">
              {profileUser.role || 'user'}
            </span>
          </div>

          {profileUser.bio && !isEditing && (
            <p className="text-gray-300 font-vt323 mt-2 text-lg max-w-xl">{profileUser.bio}</p>
          )}

          {isEditing && (
            <div className="mt-3 flex flex-col gap-3 max-w-md">
              <div>
                <label className="text-gray-400 text-xs font-vt323 uppercase">Nickname</label>
                <input
                  className="w-full bg-[#3a3a3a] border-2 border-[#1e1e1e] text-white p-2 font-vt323 focus:outline-none focus:border-[#a0a0a0]"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                />
                {nicknameError && <p className="text-red-500 text-xs font-vt323 mt-1">{nicknameError}</p>}
              </div>
              <div>
                <label className="text-gray-400 text-xs font-vt323 uppercase">Bio</label>
                <textarea
                  className="w-full bg-[#3a3a3a] border-2 border-[#1e1e1e] text-white p-2 font-vt323 h-20 focus:outline-none focus:border-[#a0a0a0]"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell about yourself..."
                />
              </div>
            </div>
          )}
          
          {/* Ban notice for own profile */}
          {isOwnProfile && profileUser.bannedUntil && new Date(profileUser.bannedUntil) > new Date() && (
            <div className="bg-[#aa0000]/20 border border-[#aa0000] p-3 mt-3 max-w-xl">
              <div className="flex items-center gap-2 text-[#ff4444] font-vt323 text-lg">
                <ShieldAlert size={18} />
                <span>Your account is banned until {new Date(profileUser.bannedUntil).toLocaleString()}</span>
              </div>
              {profileUser.banReason && (
                <p className="text-gray-400 font-vt323 mt-1">Reason: {profileUser.banReason}</p>
              )}
            </div>
          )}

          <div className="flex gap-6 mt-2 font-vt323 text-gray-300 text-lg">
            <span>{(profileUser.subscribers || []).length} Subscribers</span>
            <span>{views} Total Views</span>
            <span>{downloads} Total Downloads</span>
          </div>

          <div className="flex gap-4 mt-4 flex-wrap">
            {isOwnProfile ? (
              <>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="success" onClick={handleSaveProfile} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)} disabled={saving}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    <PenTool size={16}/> Edit Profile
                  </Button>
                )}
                
                <Link to="/submit">
                  <Button size="sm" variant="success">
                    <PlusCircle size={16}/> New Project
                  </Button>
                </Link>

                <Button size="sm" variant="danger" onClick={handleLogout}>
                  <LogOut size={16}/> Logout
                </Button>
              </>
            ) : (
              currentUser && (
                <Button 
                  size="sm" 
                  variant={isSubscribed ? 'secondary' : 'success'} 
                  onClick={handleSubscribe}
                >
                  {isSubscribed ? <><UserMinus size={16}/> Unsubscribe</> : <><UserPlus size={16}/> Subscribe</>}
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="container mx-auto px-4 mt-12">
        <h2 className="text-2xl font-vt323 text-white mb-6 border-b-2 border-[#55ff55] inline-block uppercase tracking-wider">
          Projects by {profileUser.nickname || 'User'}
        </h2>
        
        {projects.length === 0 ? (
          <div className="text-gray-500 font-vt323 text-xl">No projects found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.map(p => p && (
              <div key={p.id} className="relative">
                <ProjectCard project={p} />
                {isOwnProfile && (
                  <Link
                    to={`/edit-project/${p.id}`}
                    className="absolute top-2 right-2 bg-[#555] hover:bg-[#777] text-white p-1.5 border border-black shadow-md z-10"
                    title="Edit project"
                    onClick={e => e.stopPropagation()}
                  >
                    <Edit3 size={14} />
                  </Link>
                )}
                {isOwnProfile && (
                  <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-vt323 border border-black shadow-md ${
                    p.status === 'approved' ? 'bg-green-600 text-white' : 
                    p.status === 'pending' ? 'bg-yellow-600 text-black' : 
                    'bg-red-600 text-white'
                  }`}>
                    {p.status?.toUpperCase() || 'UNKNOWN'}
                  </div>
                )}
                {p.status === 'rejected' && isOwnProfile && (
                  <div className="bg-red-900/80 text-white text-xs p-2 mt-1 border border-red-500 font-vt323">
                    Reason: {p.rejectionReason || 'No reason provided'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
