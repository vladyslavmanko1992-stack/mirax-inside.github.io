import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Project, Comment } from '../types';
import { projectService, commentService, notificationService, getClientIP } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { ThumbsUp, ThumbsDown, Download, Eye, Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export const ProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();
  const clientIp = getClientIP();

  useEffect(() => {
    if (!id) return;

    // Real-time project listener
    const unsubProject = projectService.onProject(id, (p) => {
      setProject(p);
      setLoading(false);
    });

    // Real-time comments listener
    const unsubComments = commentService.onProjectComments(id, (c) => {
      setComments(c.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    });

    // Increment view count once (unique per client)
    projectService.view(id, clientIp).catch(console.error);

    return () => {
      unsubProject();
      unsubComments();
    };
  }, [id]);

  const handleVote = async (type: 'like' | 'dislike') => {
    if (!project || !id) return;
    await projectService.vote(id, clientIp, type);
    // State updates automatically via real-time listener
  };

  const handleDownload = async () => {
    if (!project || !id || !project.downloadLink) return;
    await projectService.download(id, clientIp);
    window.open(project.downloadLink, '_blank');
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project || !newComment.trim()) return;
    await commentService.add({
      projectId: project.id,
      authorId: user.id,
      authorName: user.nickname,
      authorAvatar: user.avatar,
      content: newComment,
    });
    // Send notification to project author (if commenter is not the author)
    if (user.id !== project.authorId) {
      await notificationService.add({
        recipientId: project.authorId,
        type: 'comment',
        projectId: project.id,
        projectTitle: project.title,
        fromUserId: user.id,
        fromUserName: user.nickname,
        commentPreview: newComment.trim().substring(0, 100),
      });
    }
    setNewComment('');
    // Comments update automatically via real-time listener
  };

  const handleDeleteComment = async (commentId: string) => {
    await commentService.delete(commentId);
    // Comments update automatically via real-time listener
  };

  const handlePrevImage = () => {
    if (!project || !project.images || project.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev === 0 ? project.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!project || !project.images || project.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev === project.images.length - 1 ? 0 : prev + 1));
  };

  if (loading) {
    return (
      <div className="text-center mt-10 text-gray-500 font-vt323 text-xl animate-pulse">
        Loading project...
      </div>
    );
  }

  if (!project) {
    return <div className="text-white text-center mt-10">Project not found</div>;
  }

  const images = project.images || [];
  const currentImage = images[currentImageIndex];

  return (
    <div className="container mx-auto p-4 pb-20 max-w-4xl">
      <div className="bg-[#2c2c2c] border-4 border-[#181818] p-6 shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 border-b border-[#444] pb-4">
          <div>
            <h1 className="text-4xl font-vt323 text-[#55ff55]">{project.title}</h1>
            <div className="text-gray-400 font-vt323 text-lg flex gap-4 flex-wrap">
              <Link to={`/profile/${project.authorId}`} className="hover:text-[#55ff55] hover:underline">by {project.authorName}</Link>
              <span>Ver: {project.projectVersion}</span>
              <span className="bg-[#444] px-2 rounded text-white text-sm">{project.category}</span>
              <span className="bg-[#444] px-2 rounded text-white text-sm">{project.core}</span>
              <span className="bg-[#444] px-2 rounded text-white text-sm">MC {project.mcVersion}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {project.isPreRelease && project.releaseDate && new Date(project.releaseDate) > new Date() ? (
              <div className="text-center">
                <div className="bg-[#ffaa00] text-black px-4 py-2 font-vt323 text-lg flex items-center gap-2">
                  <Clock size={20} />
                  {project.releaseDateDisplay === 'coming_soon' ? (
                    <span>Coming Soon</span>
                  ) : (
                    <span>Release: {new Date(project.releaseDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ) : project.downloadLink ? (
              <>
                <Button size="lg" variant="success" onClick={handleDownload} className="w-full">
                  <Download size={20} /> Download
                </Button>
                <div className="text-gray-400 text-sm font-vt323">{project.downloads} downloads</div>
              </>
            ) : (
              <div className="text-gray-500 font-vt323 text-sm">Download not available yet</div>
            )}
          </div>
        </div>

        {/* Gallery */}
        {images.length > 0 ? (
          <div className="mb-6 bg-black p-1 border-2 border-[#555] relative">
            <img 
              src={currentImage} 
              className="w-full h-auto max-h-[500px] object-contain" 
              alt={`${project.title} - Screenshot ${currentImageIndex + 1}`}
            />
            
            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black p-2 rounded"
                >
                  <ChevronLeft size={24} className="text-white" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black p-2 rounded"
                >
                  <ChevronRight size={24} className="text-white" />
                </button>
                
                {/* Image counter */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 px-3 py-1 rounded text-white font-vt323 text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="mb-6 bg-black p-1 border-2 border-[#555]">
            <div className="h-64 flex items-center justify-center text-gray-500">No Images</div>
          </div>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`flex-shrink-0 w-20 h-20 border-2 transition ${
                  idx === currentImageIndex 
                    ? 'border-[#55ff55]' 
                    : 'border-[#555] hover:border-[#aaa]'
                }`}
              >
                <img 
                  src={img} 
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Description */}
        <div className="bg-[#3a3a3a] p-4 border-2 border-[#1e1e1e] text-gray-200 font-vt323 text-lg whitespace-pre-wrap mb-6">
          {project.description}
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center justify-between bg-[#1e1e1e] p-4 border-t-2 border-[#55ff55] flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-gray-300">
              <Eye size={20} /> {project.views} Views
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar size={20} /> {new Date(project.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant={(project.likes || []).includes(clientIp) ? 'success' : 'secondary'}
              onClick={() => handleVote('like')}
              className="gap-2"
            >
              <ThumbsUp size={18} /> {(project.likes || []).length}
            </Button>
            <Button
              variant={(project.dislikes || []).includes(clientIp) ? 'danger' : 'secondary'}
              onClick={() => handleVote('dislike')}
              className="gap-2"
            >
              <ThumbsDown size={18} /> {(project.dislikes || []).length}
            </Button>
          </div>
        </div>

        {/* Comments */}
        <div className="mt-8">
          <h3 className="text-2xl font-vt323 text-white mb-4 border-b border-[#444]">
            Comments ({comments.length})
          </h3>
          <div className="space-y-4 mb-6">
            {comments.map((c) => (
              <div key={c.id} className="bg-[#333] p-3 border-l-4 border-[#55ff55]">
                <div className="flex justify-between text-gray-400 text-sm font-vt323 mb-1">
                  <Link to={`/profile/${c.authorId}`} className="text-[#55ff55] font-bold hover:underline">{c.authorName}</Link>
                  <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-200 font-vt323">{c.content}</p>
                {(user?.role === 'admin' || user?.role === 'moderator' || user?.id === c.authorId) && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-[#aa0000] text-xs hover:underline mt-2"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
          {user ? (
            user.bannedUntil && new Date(user.bannedUntil) > new Date() ? (
              <div className="text-[#aa0000] font-vt323 text-center p-2 border border-[#aa0000] bg-[#aa0000]/10">
                You are banned and cannot comment. Ban expires: {new Date(user.bannedUntil).toLocaleString()}
              </div>
            ) : (
              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  className="flex-1 bg-[#222] border border-[#555] text-white p-2 font-vt323"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button type="submit">Post</Button>
              </form>
            )
          ) : (
            <div className="text-gray-500 font-vt323 text-center">Login to comment</div>
          )}
        </div>
      </div>
    </div>
  );
};
