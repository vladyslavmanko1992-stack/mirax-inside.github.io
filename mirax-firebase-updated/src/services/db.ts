import { User, Project, Comment, Notification } from '../types';
import { db } from './firebase';
import {
  ref,
  get,
  set,
  update,
  remove,
  onValue,
  off,
  DataSnapshot,
} from 'firebase/database';

// ─── Helper ───────────────────────────────────────────────────────────────────

const generateId = () => Math.random().toString(36).substr(2, 9);

// Firebase Realtime Database drops empty arrays, so we need to ensure
// array fields are always arrays when reading data back.
const normalizeProject = (p: any): Project => ({
  ...p,
  likes: Array.isArray(p.likes) ? p.likes : [],
  dislikes: Array.isArray(p.dislikes) ? p.dislikes : [],
  images: Array.isArray(p.images) ? p.images : [],
  views: p.views || 0,
  downloads: p.downloads || 0,
  viewedBy: Array.isArray(p.viewedBy) ? p.viewedBy : [],
  downloadedBy: Array.isArray(p.downloadedBy) ? p.downloadedBy : [],
});

const IP_KEY = 'mirax_client_ip';

export const getClientIP = (): string => {
  let ip = localStorage.getItem(IP_KEY);
  if (!ip) {
    ip = generateId();
    localStorage.setItem(IP_KEY, ip);
  }
  return ip;
};

// ─── Init: create admin if not exists ─────────────────────────────────────────

export const initDB = async (): Promise<void> => {
  try {
    const adminRef = ref(db, 'users/admin-1');
    const snap = await get(adminRef);
    if (!snap.exists()) {
      const adminUser: User = {
        id: 'admin-1',
        nickname: 'Vladyslav',
        email: 'admin@mirax.com',
        password: 'Esperanto123',
        role: 'admin',
        subscribers: [],
        createdAt: new Date().toISOString(),
        ip: 'admin-ip',
      };
      await set(adminRef, adminUser);
    }
  } catch (e) {
    console.error('initDB error:', e);
  }
};

// ─── User Service ──────────────────────────────────────────────────────────────

export const userService = {
  getAll: async (): Promise<User[]> => {
    const snap = await get(ref(db, 'users'));
    if (!snap.exists()) return [];
    return Object.values(snap.val()) as User[];
  },

  getById: async (id: string): Promise<User | undefined> => {
    const snap = await get(ref(db, `users/${id}`));
    return snap.exists() ? (snap.val() as User) : undefined;
  },

  register: async (
    user: Omit<User, 'id' | 'createdAt' | 'role' | 'subscribers' | 'ip'>
  ): Promise<User> => {
    const users = await userService.getAll();
    if (users.find((u) => u.nickname === user.nickname))
      throw new Error('Nickname taken');
    if (users.find((u) => u.email === user.email))
      throw new Error('Email taken');

    const newUser: User = {
      ...user,
      id: generateId(),
      role: 'user',
      subscribers: [],
      createdAt: new Date().toISOString(),
      ip: getClientIP(),
    };
    await set(ref(db, `users/${newUser.id}`), newUser);
    return newUser;
  },

  login: async (nickname: string, password: string): Promise<User> => {
    const users = await userService.getAll();
    const user = users.find(
      (u) => u.nickname === nickname && u.password === password
    );
    if (!user) throw new Error('Invalid credentials');
    // Ban check
    if (user.bannedUntil) {
      const banEnd = new Date(user.bannedUntil);
      if (banEnd > new Date()) {
        throw new Error(`You are banned until ${banEnd.toLocaleDateString()}. Reason: ${user.banReason || 'No reason provided'}`);
      }
    }
    return user;
  },

  delete: async (id: string): Promise<void> => {
    await remove(ref(db, `users/${id}`));
    // Also delete all projects by this user
    const projSnap = await get(ref(db, 'projects'));
    if (projSnap.exists()) {
      const all: Record<string, Project> = projSnap.val();
      await Promise.all(
        Object.entries(all)
          .filter(([, p]) => p.authorId === id)
          .map(([k]) => remove(ref(db, `projects/${k}`)))
      );
    }
    // Also delete all comments by this user
    const commSnap = await get(ref(db, 'comments'));
    if (commSnap.exists()) {
      const all: Record<string, Comment> = commSnap.val();
      await Promise.all(
        Object.entries(all)
          .filter(([, c]) => c.authorId === id)
          .map(([k]) => remove(ref(db, `comments/${k}`)))
      );
    }
  },

  ban: async (id: string, duration: number, unit: 'hours' | 'days', reason: string): Promise<void> => {
    const banEnd = new Date();
    if (unit === 'hours') {
      banEnd.setTime(banEnd.getTime() + duration * 60 * 60 * 1000);
    } else {
      banEnd.setDate(banEnd.getDate() + duration);
    }
    await update(ref(db, `users/${id}`), {
      bannedUntil: banEnd.toISOString(),
      banReason: reason,
    });
  },

  unban: async (id: string): Promise<void> => {
    await update(ref(db, `users/${id}`), {
      bannedUntil: '',
      banReason: '',
    });
  },

  changeNickname: async (id: string, newNickname: string): Promise<User> => {
    const users = await userService.getAll();
    if (users.find((u) => u.id !== id && u.nickname === newNickname))
      throw new Error('Nickname taken');
    const updatedUser = await userService.update(id, { nickname: newNickname });
    // Update authorName in all projects by this user
    const projSnap = await get(ref(db, 'projects'));
    if (projSnap.exists()) {
      const all: Record<string, Project> = projSnap.val();
      await Promise.all(
        Object.entries(all)
          .filter(([, p]) => p.authorId === id)
          .map(([k]) => update(ref(db, `projects/${k}`), { authorName: newNickname }))
      );
    }
    // Update authorName in all comments by this user
    const commSnap = await get(ref(db, 'comments'));
    if (commSnap.exists()) {
      const all: Record<string, Comment> = commSnap.val();
      await Promise.all(
        Object.entries(all)
          .filter(([, c]) => c.authorId === id)
          .map(([k]) => update(ref(db, `comments/${k}`), { authorName: newNickname }))
      );
    }
    return updatedUser;
  },

  makeAdmin: async (id: string): Promise<void> => {
    await update(ref(db, `users/${id}`), { role: 'admin' });
  },

  removeAdmin: async (id: string): Promise<void> => {
    await update(ref(db, `users/${id}`), { role: 'user' });
  },

  makeModerator: async (id: string): Promise<void> => {
    await update(ref(db, `users/${id}`), { role: 'moderator' });
  },

  removeModerator: async (id: string): Promise<void> => {
    await update(ref(db, `users/${id}`), { role: 'user' });
  },

  update: async (id: string, updates: Partial<User>): Promise<User> => {
    const snap = await get(ref(db, `users/${id}`));
    if (!snap.exists()) throw new Error('User not found');
    const updated: User = { ...snap.val(), ...updates };
    await set(ref(db, `users/${id}`), updated);
    return updated;
  },

  subscribe: async (
    targetUserId: string,
    currentUserId: string
  ): Promise<void> => {
    const snap = await get(ref(db, `users/${targetUserId}`));
    if (!snap.exists()) return;
    const target: User = snap.val();
    const subs: string[] = target.subscribers || [];

    const updated = subs.includes(currentUserId)
      ? subs.filter((id) => id !== currentUserId)
      : [...subs, currentUserId];

    await update(ref(db, `users/${targetUserId}`), { subscribers: updated });
  },

  // Real-time listener for a single user
  onUser: (
    id: string,
    callback: (user: User | null) => void
  ): (() => void) => {
    const r = ref(db, `users/${id}`);
    const handler = (snap: DataSnapshot) => {
      callback(snap.exists() ? (snap.val() as User) : null);
    };
    onValue(r, handler);
    return () => off(r, 'value', handler);
  },
};

// ─── Project Service ───────────────────────────────────────────────────────────

export const projectService = {
  getAll: async (): Promise<Project[]> => {
    const snap = await get(ref(db, 'projects'));
    if (!snap.exists()) return [];
    return (Object.values(snap.val()) as any[]).map(normalizeProject);
  },

  getById: async (id: string): Promise<Project | undefined> => {
    const snap = await get(ref(db, `projects/${id}`));
    return snap.exists() ? normalizeProject(snap.val()) : undefined;
  },

  create: async (
    project: Omit<
      Project,
      | 'id'
      | 'views'
      | 'downloads'
      | 'likes'
      | 'dislikes'
      | 'createdAt'
      | 'updatedAt'
      | 'status'
      | 'isRecommended'
    >
  ): Promise<Project> => {
    const newProject: Project = {
      ...project,
      id: generateId(),
      views: 0,
      downloads: 0,
      likes: [],
      dislikes: [],
      status: 'pending',
      isRecommended: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await set(ref(db, `projects/${newProject.id}`), newProject);
    return newProject;
  },

  update: async (id: string, updates: Partial<Project>): Promise<Project> => {
    const snap = await get(ref(db, `projects/${id}`));
    if (!snap.exists()) throw new Error('Project not found');
    const current: Project = snap.val();

    const isContentUpdate =
      updates.title ||
      updates.description ||
      updates.downloadLink ||
      updates.images;

    const updated: Project = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      status:
        isContentUpdate && updates.status === undefined
          ? 'pending'
          : updates.status || current.status,
    };
    await set(ref(db, `projects/${id}`), updated);
    return updated;
  },

  delete: async (id: string): Promise<void> => {
    await remove(ref(db, `projects/${id}`));
    // Also remove comments for this project
    const snap = await get(ref(db, 'comments'));
    if (snap.exists()) {
      const all: Record<string, Comment> = snap.val();
      await Promise.all(
        Object.entries(all)
          .filter(([, c]) => c.projectId === id)
          .map(([k]) => remove(ref(db, `comments/${k}`)))
      );
    }
  },

  vote: async (
    projectId: string,
    userId: string,
    type: 'like' | 'dislike'
  ): Promise<void> => {
    const snap = await get(ref(db, `projects/${projectId}`));
    if (!snap.exists()) return;
    const project: Project = snap.val();

    const likes = (project.likes || []).filter((id) => id !== userId);
    const dislikes = (project.dislikes || []).filter((id) => id !== userId);

    if (type === 'like') likes.push(userId);
    else dislikes.push(userId);

    await update(ref(db, `projects/${projectId}`), { likes, dislikes });
  },

  view: async (projectId: string, clientIp: string): Promise<void> => {
    const snap = await get(ref(db, `projects/${projectId}`));
    if (!snap.exists()) return;
    const project = normalizeProject(snap.val());
    const viewedBy = project.viewedBy || [];
    if (viewedBy.includes(clientIp)) return; // Already counted
    await update(ref(db, `projects/${projectId}`), {
      views: (project.views || 0) + 1,
      viewedBy: [...viewedBy, clientIp],
    });
  },

  download: async (projectId: string, clientIp: string): Promise<void> => {
    const snap = await get(ref(db, `projects/${projectId}`));
    if (!snap.exists()) return;
    const project = normalizeProject(snap.val());
    const downloadedBy = project.downloadedBy || [];
    if (downloadedBy.includes(clientIp)) return; // Already counted
    await update(ref(db, `projects/${projectId}`), {
      downloads: (project.downloads || 0) + 1,
      downloadedBy: [...downloadedBy, clientIp],
    });
  },

  // Real-time listener for all projects (live updates)
  onProjects: (callback: (projects: Project[]) => void): (() => void) => {
    const r = ref(db, 'projects');
    const handler = (snap: DataSnapshot) => {
      if (!snap.exists()) {
        callback([]);
        return;
      }
      callback((Object.values(snap.val()) as any[]).map(normalizeProject));
    };
    onValue(r, handler);
    return () => off(r, 'value', handler);
  },

  // Real-time listener for a single project
  onProject: (
    id: string,
    callback: (project: Project | null) => void
  ): (() => void) => {
    const r = ref(db, `projects/${id}`);
    const handler = (snap: DataSnapshot) => {
      callback(snap.exists() ? normalizeProject(snap.val()) : null);
    };
    onValue(r, handler);
    return () => off(r, 'value', handler);
  },
};

// ─── Comment Service ───────────────────────────────────────────────────────────

export const commentService = {
  getByProject: async (projectId: string): Promise<Comment[]> => {
    const snap = await get(ref(db, 'comments'));
    if (!snap.exists()) return [];
    return (Object.values(snap.val()) as Comment[]).filter(
      (c) => c.projectId === projectId
    );
  },

  add: async (comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> => {
    const newComment: Comment = {
      ...comment,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await set(ref(db, `comments/${newComment.id}`), newComment);
    return newComment;
  },

  delete: async (id: string): Promise<void> => {
    await remove(ref(db, `comments/${id}`));
  },

  // Real-time listener for comments on a project
  onProjectComments: (
    projectId: string,
    callback: (comments: Comment[]) => void
  ): (() => void) => {
    const r = ref(db, 'comments');
    const handler = (snap: DataSnapshot) => {
      if (!snap.exists()) {
        callback([]);
        return;
      }
      const all = Object.values(snap.val()) as Comment[];
      callback(all.filter((c) => c.projectId === projectId));
    };
    onValue(r, handler);
    return () => off(r, 'value', handler);
  },
};

// ─── Notification Service ─────────────────────────────────────────────────────

export const notificationService = {
  getByUser: async (userId: string): Promise<Notification[]> => {
    const snap = await get(ref(db, 'notifications'));
    if (!snap.exists()) return [];
    return (Object.values(snap.val()) as Notification[])
      .filter((n) => n.recipientId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  add: async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    await set(ref(db, `notifications/${newNotification.id}`), newNotification);
    return newNotification;
  },

  markAsRead: async (id: string): Promise<void> => {
    await update(ref(db, `notifications/${id}`), { read: true });
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    const snap = await get(ref(db, 'notifications'));
    if (!snap.exists()) return;
    const all: Record<string, Notification> = snap.val();
    await Promise.all(
      Object.entries(all)
        .filter(([, n]) => n.recipientId === userId && !n.read)
        .map(([k]) => update(ref(db, `notifications/${k}`), { read: true }))
    );
  },

  delete: async (id: string): Promise<void> => {
    await remove(ref(db, `notifications/${id}`));
  },

  // Real-time listener for user notifications
  onUserNotifications: (
    userId: string,
    callback: (notifications: Notification[]) => void
  ): (() => void) => {
    const r = ref(db, 'notifications');
    const handler = (snap: DataSnapshot) => {
      if (!snap.exists()) {
        callback([]);
        return;
      }
      const all = Object.values(snap.val()) as Notification[];
      callback(
        all
          .filter((n) => n.recipientId === userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
    };
    onValue(r, handler);
    return () => off(r, 'value', handler);
  },
};

// Initialize admin on first load
initDB().catch(console.error);
