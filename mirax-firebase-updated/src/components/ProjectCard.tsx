import React from 'react';
import { Project } from '../types';
import { Link } from 'react-router-dom';
import { Download, Eye, ThumbsUp, Clock } from 'lucide-react';
import { cn } from '../utils/cn';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <Link to={`/project/${project.id}`} className="block group">
      <div className={cn(
        "bg-[#2c2c2c] border-2 border-[#181818] p-2 hover:border-[#55ff55] transition-colors relative overflow-hidden",
        project.isRecommended && "border-[#ffaa00] shadow-[0_0_10px_#ffaa00]"
      )}>
        {project.isRecommended && (
           <div className="absolute top-0 right-0 bg-[#ffaa00] text-black text-xs font-vt323 px-2 py-0.5 z-10">Recommended</div>
        )}
        {project.isPreRelease && project.releaseDate && new Date(project.releaseDate) > new Date() && (
           <div className="absolute top-0 left-0 bg-[#aa00aa] text-white text-xs font-vt323 px-2 py-0.5 z-10 flex items-center gap-1">
             <Clock size={10} /> Pre-release
           </div>
        )}
        
        <div className="aspect-video bg-black overflow-hidden mb-2 relative">
           {(project.images || [])[0] ? (
             <img src={project.images[0]} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pixelated" />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-gray-600 font-vt323">No Image</div>
           )}
           <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 font-vt323">{project.category}</span>
        </div>

        <h3 className="text-white text-lg font-vt323 truncate">{project.title}</h3>
        <div className="flex justify-between items-center text-gray-400 text-xs font-vt323 mt-1">
           <Link to={`/profile/${project.authorId}`} onClick={e => e.stopPropagation()} className="hover:text-[#55ff55] hover:underline">by {project.authorName}</Link>
           <span className="text-[#aaa]">{project.mcVersion}</span>
        </div>

        <div className="flex gap-3 mt-2 border-t border-[#444] pt-2 text-gray-400 text-xs font-vt323">
           <div className="flex items-center gap-1"><Eye size={12}/> {project.views}</div>
           <div className="flex items-center gap-1"><Download size={12}/> {project.downloads}</div>
           <div className="flex items-center gap-1"><ThumbsUp size={12}/> {(project.likes || []).length}</div>
        </div>
      </div>
    </Link>
  );
};
