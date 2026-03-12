import React, { useEffect, useState } from 'react';
import { Project, ProjectCategory, User } from '../types';
import { projectService, userService } from '../services/db';
import { ProjectCard } from '../components/ProjectCard';
import { Select } from '../components/Select';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

const CATEGORIES: ProjectCategory[] = [
  'Mods', 'Modpacks', 'Datapacks', 'MapsWithMods', 'Maps', 'TexturePacks', 'Shaders',
];

export const HomePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [bannedUserIds, setBannedUserIds] = useState<Set<string>>(new Set());

  // Load banned users
  useEffect(() => {
    const loadBannedUsers = async () => {
      const allUsers = await userService.getAll();
      const now = new Date();
      const banned = new Set(
        allUsers
          .filter(u => u.bannedUntil && new Date(u.bannedUntil) > now)
          .map(u => u.id)
      );
      setBannedUserIds(banned);
    };
    loadBannedUsers();
  }, []);

  // Real-time subscription — updates instantly when any user publishes a project
  useEffect(() => {
    const unsubscribe = projectService.onProjects((all) => {
      const approved = all.filter((p) => {
        if (p.status !== 'approved') return false;
        // Hide banned users' projects
        if (bannedUserIds.has(p.authorId)) return false;
        // Hide pre-release projects whose release date has passed but have no download link
        if (p.isPreRelease && p.releaseDate && new Date(p.releaseDate) <= new Date() && !p.downloadLink) {
          return false;
        }
        return true;
      });
      setProjects(approved);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [bannedUserIds]);

  useEffect(() => {
    let result = projects;
    if (category !== 'All') {
      result = result.filter((p) => p.category === category);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower)
      );
    }
    setFilteredProjects(result);
  }, [category, search, projects]);

  const recommended = projects.filter((p) => p.isRecommended);

  return (
    <div className="container mx-auto p-4 pb-20">
      {/* Search & Filter */}
      <div className="bg-[#2c2c2c] border-2 border-[#181818] p-4 mb-8 flex flex-col md:flex-row gap-4 items-end shadow-md">
        <div className="flex-1 w-full">
          <Input
            label="Search Projects"
            placeholder="Start typing..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select
            label="Category"
            options={[
              { value: 'All', label: 'All Categories' },
              ...CATEGORIES.map((c) => ({ value: c, label: c })),
            ]}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <Button onClick={() => { setSearch(''); setCategory('All'); }}>Clear</Button>
      </div>

      {loading && (
        <div className="text-center py-20 text-gray-500 font-vt323 text-xl animate-pulse">
          Loading projects...
        </div>
      )}

      {!loading && (
        <>
          {/* Recommended Section */}
          {recommended.length > 0 && !search && category === 'All' && (
            <div className="mb-10">
              <h2 className="text-2xl font-vt323 text-[#ffaa00] mb-4 border-b-2 border-[#ffaa00] inline-block uppercase tracking-wider">
                Recommended
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommended.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </div>
          )}

          {/* All Projects */}
          <h2 className="text-2xl font-vt323 text-white mb-4 border-b-2 border-[#55ff55] inline-block uppercase tracking-wider">
            {category === 'All' ? 'Latest Projects' : `${category}`}
          </h2>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-20 text-gray-500 font-vt323 text-xl">
              No projects found...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProjects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
