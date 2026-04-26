import { useState, useEffect, useRef, useCallback } from "react";
import { Input, List, Card, Empty, Spin, Tag, Typography } from "antd";
import { SearchOutlined, CloseCircleFilled, ProjectOutlined, GlobalOutlined, FileTextOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { searchService, SearchResults } from "@smart/services/search.service";
import debounce from "lodash/debounce";

const { Text } = Typography;

export function Search({ placeholder = "Tìm kiếm thông minh..." }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ projects: [], news: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) {
        setResults({ projects: [], news: [], posts: [] });
        return;
      }
      setLoading(true);
      try {
        const data = await searchService.search(q);
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    fetchSuggestions(query);
  }, [query, fetchSuggestions]);

  const handleSearch = (q?: string) => {
    const value = q ?? query;
    if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value.trim())}`);
      setFocused(false);
    }
  };

  const handleSelect = (type: 'project' | 'news' | 'post', id: string) => {
    setFocused(false);
    if (type === 'project') router.push(`/projects/${id}`);
    else if (type === 'news') router.push(`/news/${id}`);
    else if (type === 'post') router.push(`/posts/${id}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setFocused(true);
        const input = containerRef.current?.querySelector('input');
        input?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = results.projects.length > 0 || results.news.length > 0 || results.posts.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-[700px]">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
        suffix={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading && <Spin size="small" />}
            {query && (
              <CloseCircleFilled
                onClick={() => setQuery("")}
                style={{ color: "rgba(0,0,0,.25)", cursor: "pointer" }}
              />
            )}
          </div>
        }
        onPressEnter={() => handleSearch()}
        style={{ borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      />

      {focused && (query.trim() || loading) && (
        <Card
          className="search-suggestions-card"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 8,
            zIndex: 1000,
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxHeight: '450px',
            overflowY: 'auto'
          }}
          styles={{ body: { padding: '8px 0' } }}
        >
          {!loading && !hasResults && query.trim() && (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không tìm thấy kết quả" />
          )}

          {results.projects.length > 0 && (
            <div className="search-group">
              <div style={{ padding: '4px 16px', background: '#fafafa', fontWeight: 600, fontSize: '12px', color: '#8c8c8c' }}>
                <ProjectOutlined style={{ marginRight: 8 }} /> DỰ ÁN
              </div>
              {results.projects.map(p => (
                <div key={p.id} className="suggestion-item" onClick={() => handleSelect('project', p.id)}>
                  {p.name}
                </div>
              ))}
            </div>
          )}

          {results.news.length > 0 && (
            <div className="search-group" style={{ marginTop: 8 }}>
              <div style={{ padding: '4px 16px', background: '#fafafa', fontWeight: 600, fontSize: '12px', color: '#8c8c8c' }}>
                <GlobalOutlined style={{ marginRight: 8 }} /> TIN TỨC
              </div>
              {results.news.map(n => (
                <div key={n.id} className="suggestion-item" onClick={() => handleSelect('news', n.id)}>
                  {n.title}
                </div>
              ))}
            </div>
          )}

          {results.posts.length > 0 && (
            <div className="search-group" style={{ marginTop: 8 }}>
              <div style={{ padding: '4px 16px', background: '#fafafa', fontWeight: 600, fontSize: '12px', color: '#8c8c8c' }}>
                <FileTextOutlined style={{ marginRight: 8 }} /> BÀI VIẾT
              </div>
              {results.posts.map(p => (
                <div key={p.id} className="suggestion-item" onClick={() => handleSelect('post', p.id)}>
                  {p.title || p.content?.substring(0, 50) + "..."}
                </div>
              ))}
            </div>
          )}

          <style jsx>{`
            .suggestion-item {
              padding: 10px 16px;
              cursor: pointer;
              transition: all 0.2s;
              font-size: 14px;
            }
            .suggestion-item:hover {
              background-color: #f0f7ff;
              color: #1890ff;
            }
          `}</style>
        </Card>
      )}
    </div>
  );
}
