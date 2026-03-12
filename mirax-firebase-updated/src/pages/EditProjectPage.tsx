import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/db';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { ProjectCategory, ProjectCore, Project } from '../types';
import { X } from 'lucide-react';

const CATEGORIES: { value: ProjectCategory; label: string }[] = [
  { value: 'Mods', label: 'Mods' },
  { value: 'Modpacks', label: 'Modpacks' },
  { value: 'Datapacks', label: 'Datapacks' },
  { value: 'MapsWithMods', label: 'Maps with Mods' },
  { value: 'Maps', label: 'Maps' },
  { value: 'TexturePacks', label: 'Texture Packs' },
  { value: 'Shaders', label: 'Shaders' },
];

const CORES: { value: ProjectCore; label: string }[] = [
  { value: 'Fabric', label: 'Fabric' },
  { value: 'Forge', label: 'Forge' },
  { value: 'Vanilla', label: 'Vanilla' },
];

export const EditProjectPage: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mcVersion, setMcVersion] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Mods');
  const [projectVersion, setProjectVersion] = useState('');
  const [core, setCore] = useState<ProjectCore>('Fabric');
  const [downloadLink, setDownloadLink] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isPreRelease, setIsPreRelease] = useState(false);
  const [releaseDate, setReleaseDate] = useState('');
  const [releaseDateDisplay, setReleaseDateDisplay] = useState<'date' | 'coming_soon'>('date');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      try {
        const p = await projectService.getById(id);
        if (!p) {
          setError('Project not found');
          return;
        }
        if (user && p.authorId !== user.id && user.role !== 'admin') {
          setError('You can only edit your own projects');
          return;
        }
        setProject(p);
        setTitle(p.title);
        setDescription(p.description);
        setMcVersion(p.mcVersion);
        setCategory(p.category);
        setProjectVersion(p.projectVersion || '');
        setCore(p.core);
        setDownloadLink(p.downloadLink);
        setImages(p.images || []);
        setIsPreRelease(p.isPreRelease || false);
        setReleaseDate(p.releaseDate ? new Date(p.releaseDate).toISOString().split('T')[0] : '');
        setReleaseDateDisplay(p.releaseDateDisplay || 'date');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setPageLoading(false);
      }
    };
    loadProject();
  }, [id, user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      let totalSize = 0;
      const newImages: string[] = [];
      let processedCount = 0;

      files.forEach((file, index) => {
        totalSize += file.size;
        if (totalSize > 10000000) {
          setError('Total image size too large (max 10MB)');
          return;
        }
        if (file.size > 2000000) {
          setError(`Image ${index + 1} too large (max 2MB)`);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          processedCount++;
          if (processedCount === files.length) {
            setImages(prev => [...prev, ...newImages]);
            setError('');
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project) return;

    setError('');
    setLoading(true);

    try {
      if (!title || !description || !mcVersion) {
        throw new Error('Fill all required fields');
      }

      if (!isPreRelease && !downloadLink) {
        throw new Error('Download link is required for non-pre-release projects');
      }

      if (isPreRelease && !releaseDate) {
        throw new Error('Release date is required for pre-release projects');
      }
      if (images.length === 0) {
        throw new Error('Add at least one screenshot');
      }

      await projectService.update(project.id, {
        title,
        description,
        mcVersion,
        category,
        projectVersion,
        core,
        images,
        downloadLink,
        rejectionReason: '',
        isPreRelease,
        releaseDate: isPreRelease && releaseDate ? new Date(releaseDate).toISOString() : '',
        releaseDateDisplay: isPreRelease ? releaseDateDisplay : 'date',
      });

      navigate('/profile/' + user.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-8 text-center text-white font-vt323 text-2xl">Please login</div>;
  if (pageLoading) return <div className="p-8 text-center text-white font-vt323 text-2xl">Loading project...</div>;
  if (!project) return <div className="p-8 text-center text-white font-vt323 text-2xl">{error || 'Project not found'}</div>;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="bg-[#2c2c2c] border-4 border-[#181818] p-6 shadow-lg">
        <h1 className="text-3xl font-vt323 text-[#55ff55] mb-2 border-b border-[#444] pb-2">Edit Project</h1>
        <p className="text-gray-400 font-vt323 mb-4 text-sm">
          After saving, the project will be re-sent for moderation.
        </p>
        {error && <div className="bg-[#aa0000] text-white p-2 mb-4 font-vt323 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={loading}
          />

          <div className="flex flex-col gap-1">
            <label className="text-gray-300 uppercase text-sm font-vt323">Description</label>
            <textarea
              className="bg-[#3a3a3a] border-2 border-[#1e1e1e] text-white p-2 font-vt323 h-32 focus:outline-none focus:border-[#a0a0a0] disabled:opacity-50"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Minecraft Version"
              placeholder="e.g. 1.20.1"
              value={mcVersion}
              onChange={e => setMcVersion(e.target.value)}
              disabled={loading}
            />
            <Input
              label="Project Version"
              placeholder="e.g. 1.0.0"
              value={projectVersion}
              onChange={e => setProjectVersion(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={CATEGORIES}
              value={category}
              onChange={e => setCategory(e.target.value as ProjectCategory)}
            />
            <Select
              label="Core"
              options={CORES}
              value={core}
              onChange={e => setCore(e.target.value as ProjectCore)}
            />
          </div>

          {/* Pre-release toggle */}
          <div className="bg-[#3a3a3a] border-2 border-[#1e1e1e] p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPreRelease}
                onChange={e => setIsPreRelease(e.target.checked)}
                className="w-5 h-5 accent-[#55ff55]"
                disabled={loading}
              />
              <span className="text-gray-300 font-vt323 text-lg uppercase">Pre-release Project</span>
            </label>
            <p className="text-gray-500 text-xs font-vt323 mt-1">
              Mark as pre-release if the map is not ready for download yet. You can add the download link later.
            </p>

            {isPreRelease && (
              <div className="mt-4 flex flex-col gap-4">
                <Input
                  label="Release Date"
                  type="date"
                  value={releaseDate}
                  onChange={e => setReleaseDate(e.target.value)}
                  disabled={loading}
                />
                <Select
                  label="Display Mode"
                  options={[
                    { value: 'date', label: 'Show release date' },
                    { value: 'coming_soon', label: 'Show "Coming Soon"' },
                  ]}
                  value={releaseDateDisplay}
                  onChange={e => setReleaseDateDisplay(e.target.value as 'date' | 'coming_soon')}
                />
              </div>
            )}
          </div>

          <Input
            label={isPreRelease ? 'Download Link (optional, can be added later)' : 'Download Link'}
            placeholder="Google Drive / Yandex Disk"
            value={downloadLink}
            onChange={e => setDownloadLink(e.target.value)}
            disabled={loading}
          />

          <div className="flex flex-col gap-1">
            <label className="text-gray-300 uppercase text-sm font-vt323">
              Project Screenshots (Max 10MB total, 2MB per image)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="text-gray-300 font-vt323"
              disabled={loading}
            />
            <p className="text-gray-500 text-xs font-vt323 mt-1">
              You can select multiple images at once. {images.length} image(s) selected.
            </p>
          </div>

          {images.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-gray-300 uppercase text-sm font-vt323">Preview ({images.length} images)</label>
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-24 object-cover border-2 border-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="mt-4"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save & Re-submit for Moderation'}
          </Button>
        </form>
      </div>
    </div>
  );
};
