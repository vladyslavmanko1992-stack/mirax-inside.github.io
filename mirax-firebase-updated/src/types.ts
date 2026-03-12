export type UserRole = 'user' | 'admin' | 'moderator';

export interface User {
  id: string;
  nickname: string;
  email: string;
  password: string; // In a real app, this would be hashed
  avatar?: string;
  banner?: string;
  bio?: string;
  role: UserRole;
  subscribers: string[]; // List of user IDs who subscribed to this user
  createdAt: string;
  ip: string; // Simulated IP for "one account per IP" checks if needed
  bannedUntil?: string; // ISO date string — if set and in the future, user is banned
  banReason?: string;
}

export type ProjectCategory = 
  | 'Mods' 
  | 'Modpacks' 
  | 'Datapacks' 
  | 'MapsWithMods' 
  | 'Maps' 
  | 'TexturePacks' 
  | 'Shaders';

export type ProjectCore = 'Fabric' | 'Forge' | 'Vanilla';

export type ProjectStatus = 'pending' | 'approved' | 'rejected';

export interface Project {
  id: string;
  authorId: string;
  authorName: string; // Cache for display
  title: string;
  description: string;
  mcVersion: string;
  category: ProjectCategory;
  projectVersion: string;
  core: ProjectCore;
  images: string[];
  downloadLink: string;
  status: ProjectStatus;
  rejectionReason?: string;
  views: number;
  downloads: number;
  likes: string[]; // List of user IDs or IPs
  dislikes: string[]; // List of user IDs or IPs
  createdAt: string;
  updatedAt: string;
  isRecommended: boolean;
  changesSummary?: string; // "What changed" field
  // Pre-release fields
  isPreRelease?: boolean;
  releaseDate?: string; // ISO date string — when the project becomes available
  releaseDateDisplay?: 'date' | 'coming_soon'; // How to display the release info
  // Unique tracking
  viewedBy?: string[]; // Client IPs that already viewed this project
  downloadedBy?: string[]; // Client IPs that already downloaded this project
}

export interface Comment {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientId: string; // User ID who receives the notification
  type: 'comment'; // Type of notification (extensible)
  projectId: string;
  projectTitle: string;
  fromUserId: string;
  fromUserName: string;
  commentPreview: string; // First ~100 chars of the comment
  read: boolean;
  createdAt: string;
}
