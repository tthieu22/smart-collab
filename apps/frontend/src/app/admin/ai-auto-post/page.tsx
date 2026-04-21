'use client';

import { useEffect, useState, useCallback } from 'react';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import LeftWidgets from '@smart/components/home/widgets/LeftWidgets';
import RightWidgets from '@smart/components/home/widgets/RightWidgets';
import { Loading } from '@smart/components/ui/loading';
import { Card } from '@smart/components/ui/card';
import { aiAutoPostService } from '@smart/services/ai-autopost.service';
import type { AutoPostSettings, NewsArticleCategory, NewsArticle } from '@smart/types/ai-autopost';
import type { FeedMedia } from '@smart/types/feed';
import { useNewsAdminStore } from '@smart/store/news-admin';
import { uploadService } from '@smart/services/upload.service';
import { normalizeNewsMedia } from '@smart/lib/news-media';
import Link from 'next/link';
import { 
  Settings, 
  Send, 
  Trash2, 
  Edit3, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Zap, 
  Image as ImageIcon,
  ExternalLink,
  MessageSquare,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { NewsCard } from '@smart/components/news/NewsCard';

const defaultSettings: AutoPostSettings = {
  enabled: false,
  eventTriggerEnabled: true,
  contentTemplate: 'Tao bai viet tin tuc ngan gon ve du an: {{topic}}',
  postCountPerRun: 1,
  intervalMinutes: 60,
  locale: 'vi',
};

// --- Components ---

interface AutoPostSectionProps {
  settings: AutoPostSettings;
  setSettings: React.Dispatch<React.SetStateAction<AutoPostSettings>>;
  onSave: () => Promise<void>;
  onRunNow: () => Promise<void>;
  isSaving: boolean;
}

function AutoPostSection({ settings, setSettings, onSave, onRunNow, isSaving }: AutoPostSectionProps) {
  return (
    <Card className="overflow-hidden border-none shadow-lg bg-white dark:bg-neutral-900 ring-1 ring-black/5 dark:ring-white/10">
      <div className="p-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-gray-50/50 dark:bg-neutral-800/30">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Auto Post Settings</h2>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="group flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer bg-gray-50/30 dark:bg-neutral-950/30">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all"
                checked={settings.enabled}
                onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Scheduled Posting</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Enable periodic auto-posting via cron</span>
              </div>
            </label>

            <label className="group flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer bg-gray-50/30 dark:bg-neutral-950/30">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-all"
                checked={settings.eventTriggerEnabled}
                onChange={(e) => setSettings((s) => ({ ...s, eventTriggerEnabled: e.target.checked }))}
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Event Trigger</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Trigger AI posts when project events occur</span>
              </div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">Posts per run</label>
              <div className="relative">
                <input
                  className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
                  type="number"
                  min={1}
                  max={10}
                  value={settings.postCountPerRun}
                  onChange={(e) => setSettings((s) => ({ ...s, postCountPerRun: Number(e.target.value || 1) }))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block flex items-center gap-1">
                <Clock className="w-3 h-3" /> Interval (minutes)
              </label>
              <input
                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
                type="number"
                min={1}
                value={settings.intervalMinutes}
                onChange={(e) => setSettings((s) => ({ ...s, intervalMinutes: Number(e.target.value || 1) }))}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">AI Content Template / Instructions</label>
          <textarea
            className="min-h-[120px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:border-neutral-800 dark:bg-neutral-950 dark:text-white resize-none"
            placeholder="Describe how the AI should generate content..."
            value={settings.contentTemplate}
            onChange={(e) => setSettings((s) => ({ ...s, contentTemplate: e.target.value }))}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 h-11 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
          >
            Save Configuration
          </button>
          <button
            type="button"
            onClick={onRunNow}
            disabled={isSaving}
            className="flex-1 h-11 rounded-xl border border-emerald-600/30 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all disabled:opacity-50 dark:border-emerald-500/20 dark:bg-emerald-900/20 dark:text-emerald-400 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" />
            Run Now (AI)
          </button>
        </div>
      </div>
    </Card>
  );
}

// --- Main Page ---

export default function AdminAiAutoPostPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<AutoPostSettings>(defaultSettings);
  
  // Manual Post State
  const [draftContent, setDraftContent] = useState('');
  const [draftCategory, setDraftCategory] = useState<NewsArticleCategory>('NEWS');
  const [draftLinkUrl, setDraftLinkUrl] = useState('');
  const [draftMedia, setDraftMedia] = useState<FeedMedia[]>([]);
  const [uploadingNews, setUploadingNews] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingCategory, setEditingCategory] = useState<NewsArticleCategory>('NEWS');
  const [editingLinkUrl, setEditingLinkUrl] = useState('');
  const [editingMedia, setEditingMedia] = useState<FeedMedia[]>([]);

  // Search State
  const [searchInput, setSearchInput] = useState('');
  const [goToPageInput, setGoToPageInput] = useState('');

  const {
    articles,
    total,
    page,
    limit,
    q,
    category,
    fetchNews,
    createNews: createNewsArticle,
    updateNews: updateNewsArticle,
    deleteNews: deleteNewsArticle,
    isLoading: newsLoading,
  } = useNewsAdminStore();

  useEffect(() => {
    aiAutoPostService
      .getSettings()
      .then((data) => setSettings({ ...defaultSettings, ...data }))
      .catch(() => setMessage('Cannot load auto post settings'))
      .finally(() => setIsLoading(false));
    fetchNews({ page: 0, limit: 10 });
  }, [fetchNews]);

  const handleSearch = () => {
    fetchNews({ q: searchInput, page: 0 });
  };

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil(total / limit);
    if (newPage >= 0 && (totalPages === 0 || newPage < totalPages)) {
      fetchNews({ page: newPage });
    }
  };

  const handleGoToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(goToPageInput);
    if (!isNaN(p)) {
      handlePageChange(p - 1);
      setGoToPageInput('');
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading settings..." />;
  }

  const saveSettings = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const saved = await aiAutoPostService.updateSettings(settings);
      setSettings({ ...settings, ...saved });
      setMessage('Settings saved successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const runNow = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const result = await aiAutoPostService.runNow('tin tuc admin');
      if (!result.success) {
        setMessage(result.message || 'AI generation failed');
        return;
      }
      await fetchNews({ page: 0 });
      setMessage(`Successfully created ${result.postCount ?? 0} AI posts.`);
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to run auto post');
    } finally {
      setIsSaving(false);
    }
  };

  const appendUploadedMedia = (files: FileList | null, target: 'draft' | 'edit') => {
    if (!files?.length) return;
    setUploadingNews(true);
    uploadService
      .uploadFiles('news', Array.from(files))
      .then((res) => {
        if (!res.success || !Array.isArray(res.data)) throw new Error('upload failed');
        const add: FeedMedia[] = (res.data as any[]).map((r, i) => ({
          id: r.public_id || `img-${Date.now()}-${i}`,
          type: r.resource_type === 'video' ? 'video' : 'image',
          url: r.url,
          alt: r.original_filename || `Media ${i + 1}`,
        }));
        if (target === 'draft') setDraftMedia((m) => [...m, ...add]);
        else setEditingMedia((m) => [...m, ...add]);
      })
      .catch(() => setMessage('Upload failed'))
      .finally(() => setUploadingNews(false));
  };

  const createNews = async () => {
    if (!draftContent.trim()) return;
    setIsSaving(true);
    try {
      await createNewsArticle({
        content: draftContent.trim(),
        category: draftCategory,
        linkUrl: draftLinkUrl.trim() || undefined,
        media: draftMedia,
      });
      setDraftContent('');
      setDraftLinkUrl('');
      setDraftMedia([]);
      setMessage('Post created successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to create post');
    } finally {
      setIsSaving(false);
    }
  };

  const saveEditNews = async () => {
    if (!editingId || !editingContent.trim()) return;
    setIsSaving(true);
    try {
      await updateNewsArticle({
        id: editingId,
        content: editingContent.trim(),
        category: editingCategory,
        linkUrl: editingLinkUrl.trim() || null,
        media: editingMedia,
      });
      setEditingId(null);
      setEditingContent('');
      setEditingLinkUrl('');
      setEditingMedia([]);
      setEditingCategory('NEWS');
      setMessage('Post updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to update post');
    } finally {
      setIsSaving(false);
    }
  };

  const removeNews = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setIsSaving(true);
    try {
      await deleteNewsArticle(id);
      setMessage('Post deleted');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to delete post');
    } finally {
      setIsSaving(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <SiteLayout leftSidebar={<LeftWidgets />} rightSidebar={<RightWidgets />}>
      <div className={`mx-auto w-full space-y-8 pb-20 transition-all duration-500 ${viewMode === 'grid' ? 'max-w-7xl' : 'max-w-4xl'}`}>
        
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Content Hub</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Manage your news, tips, and automated AI generation in one place.</p>
        </div>

        {/* Global Message Toast-like */}
        {message && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-3 ring-4 ring-black/5 dark:ring-white/10">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              {message}
            </div>
          </div>
        )}

        {/* 1. Manual Post Section (Now on top) */}
        <Card className="overflow-hidden border-none shadow-xl bg-white dark:bg-neutral-900 ring-1 ring-black/5 dark:ring-white/10">
          <div className="p-5 border-b border-gray-100 dark:border-neutral-800 flex items-center gap-2 bg-gray-50/50 dark:bg-neutral-800/30">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Content</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <textarea
              className="min-h-[100px] w-full rounded-2xl border-none bg-gray-100 dark:bg-neutral-950 px-5 py-4 text-base focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none font-medium"
              placeholder="What's happening? Add your content here..."
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 ml-1">External Link (Optional)</label>
                <div className="relative group">
                  <ExternalLink className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    className="w-full h-11 rounded-xl border-none bg-gray-100 dark:bg-neutral-950 pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white"
                    placeholder="https://example.com"
                    value={draftLinkUrl}
                    onChange={(e) => setDraftLinkUrl(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 ml-1">Category</label>
                <select
                  className="w-full h-11 rounded-xl border-none bg-gray-100 dark:bg-neutral-950 px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white appearance-none cursor-pointer"
                  value={draftCategory}
                  onChange={(e) => setDraftCategory(e.target.value as NewsArticleCategory)}
                >
                  <option value="NEWS">📰 News (Standard)</option>
                  <option value="TIP">💡 Tip & Guide</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1">
                <label className="relative flex items-center justify-center gap-2 h-11 w-full rounded-xl border-2 border-dashed border-gray-200 dark:border-neutral-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    disabled={uploadingNews}
                    className="hidden"
                    onChange={(e) => appendUploadedMedia(e.target.files, 'draft')}
                  />
                  <ImageIcon className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                  <span className="text-sm font-bold text-gray-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {uploadingNews ? 'Uploading...' : 'Attach Media'}
                  </span>
                </label>
              </div>
              
              <button
                type="button"
                onClick={createNews}
                disabled={isSaving || uploadingNews || !draftContent.trim()}
                className="h-11 px-8 rounded-xl bg-emerald-600 text-sm font-black text-white hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-30 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Post Now
              </button>
            </div>

            {draftMedia.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2 animate-in fade-in zoom-in duration-300">
                {draftMedia.map((m) => (
                  <div key={m.id} className="relative group h-20 w-20 overflow-hidden rounded-2xl border-2 border-white dark:border-neutral-800 shadow-md">
                    {m.type === 'image' ? (
                      <img src={m.url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                    ) : (
                      <video src={m.url} className="h-full w-full object-cover" muted />
                    )}
                    <button
                      type="button"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      onClick={() => setDraftMedia((x) => x.filter((i) => i.id !== m.id))}
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* 2. Auto Post Settings (Componentized) */}
        <AutoPostSection 
          settings={settings} 
          setSettings={setSettings} 
          onSave={saveSettings} 
          onRunNow={runNow} 
          isSaving={isSaving} 
        />

        {/* 3. Search & Article List Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-500" />
                Published Feed
              </h2>
              
              <div className="flex items-center bg-gray-100 dark:bg-neutral-900 p-1 rounded-xl ring-1 ring-black/5">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <ListIcon size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  className="w-full h-10 rounded-full border-none bg-white dark:bg-neutral-900 pl-10 pr-4 py-2 text-sm ring-1 ring-black/5 dark:ring-white/10 focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button 
                onClick={handleSearch}
                className="h-10 px-4 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold hover:opacity-80 transition-all"
              >
                Search
              </button>
            </div>
          </div>

          <div className="space-y-4 min-h-[400px]">
            {newsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold text-gray-500">Refreshing feed...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-neutral-800 opacity-60">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-lg font-bold text-gray-400">No articles found</p>
                <p className="text-sm text-gray-400">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
                {articles.map((article) => (
                  <NewsCard 
                    key={article.id} 
                    article={article} 
                    variant={viewMode}
                    actions={
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setEditingId(article.id);
                            setEditingContent(article.content);
                            setEditingCategory(article.category === 'TIP' ? 'TIP' : 'NEWS');
                            setEditingLinkUrl(article.linkUrl?.trim() ?? '');
                            setEditingMedia(normalizeNewsMedia(article.media));
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 hover:text-blue-500 transition-all flex items-center gap-1"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span className="text-[10px] font-bold">Edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            removeNews(article.id);
                          }}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-[10px] font-bold">Delete</span>
                        </button>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-gray-100 dark:border-neutral-800">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0 || newsLoading}
                  className="p-2 rounded-xl border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-20 transition-all"
                >
                  <ChevronLeft className="w-5 h-5 dark:text-white" />
                </button>
                
                <div className="flex items-center px-4 gap-2">
                  <span className="text-sm font-black text-gray-900 dark:text-white">Page {page + 1}</span>
                  <span className="text-sm font-bold text-gray-400">of {totalPages}</span>
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages - 1 || newsLoading}
                  className="p-2 rounded-xl border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-20 transition-all"
                >
                  <ChevronRight className="w-5 h-5 dark:text-white" />
                </button>
              </div>

              <form onSubmit={handleGoToPage} className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Go to page</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    className="w-16 h-10 rounded-xl border-none bg-white dark:bg-neutral-900 px-3 py-1 text-sm font-bold ring-1 ring-black/5 dark:ring-white/10 focus:ring-2 focus:ring-blue-500 text-center dark:text-white"
                    value={goToPageInput}
                    onChange={(e) => setGoToPageInput(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="h-10 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-black hover:opacity-80 transition-all uppercase"
                  >
                    Go
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
