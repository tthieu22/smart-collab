"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Typography, Empty, Spin, Button } from "antd";
import { PremiumPagination } from "@smart/components/ui/PremiumPagination";
import { searchService, SearchResults } from "@smart/services/search.service";
import SiteLayout from "@smart/components/layouts/SiteLayout";
import LeftWidgets from "@smart/components/home/widgets/LeftWidgets";
import { Card } from "@smart/components/ui/card";
import ProjectCard from "@smart/components/project/ProjectCard";
import { NewsCard } from "@smart/components/news/NewsCard";
import { Search, LayoutGrid, Newspaper, MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";

const { Title } = Typography;

function PostSearchCard({ post }: { post: any }) {
    return (
        <Link href={`/posts/${post.id}`} className="block group">
            <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800 transition-all hover:border-blue-500/50 hover:shadow-lg">
                <div className="flex gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl h-fit">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors mb-1">
                            {post.title || "Bài viết mới"}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {post.content}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {post.createdAt ? new Date(post.createdAt).toLocaleDateString("vi-VN") : "Mới"}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    const [results, setResults] = useState<SearchResults>({ projects: [], news: [], posts: [] });
    const [loading, setLoading] = useState(false);

    // Pagination states
    const [projectPage, setProjectPage] = useState(1);
    const [newsPage, setNewsPage] = useState(1);
    const [postPage, setPostPage] = useState(1);
    const pageSize = 6;

    useEffect(() => {
        const doSearch = async () => {
            if (!query) return;
            setLoading(true);
            try {
                const data = await searchService.search(query);
                setResults(data);
                // Reset pages on new search
                setProjectPage(1);
                setNewsPage(1);
                setPostPage(1);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        doSearch();
    }, [query]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Đang tìm kiếm dữ liệu thông minh...</p>
            </div>
        );
    }

    const hasProjects = results.projects.length > 0;
    const hasNews = results.news.length > 0;
    const hasPosts = results.posts.length > 0;
    const noResults = !hasProjects && !hasNews && !hasPosts;

    // Sliced results for local pagination
    const paginatedProjects = results.projects.slice((projectPage - 1) * pageSize, projectPage * pageSize);
    const paginatedNews = results.news.slice((newsPage - 1) * pageSize, newsPage * pageSize);
    const paginatedPosts = results.posts.slice((postPage - 1) * pageSize, postPage * pageSize);

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 pb-10 transition-all duration-500 pt-4">
            {/* Header section */}
            <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/10 shadow-lg shadow-black/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                                Kết quả cho: <span className="text-blue-600 dark:text-blue-400">"{query}"</span>
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Tìm thấy {results.projects.length + results.news.length + results.posts.length} kết quả phù hợp.
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {noResults ? (
                <Card padding="large" className="dark:bg-neutral-950 dark:border-neutral-800 py-32 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mb-6 ring-1 ring-black/5">
                        <Search className="w-10 h-10 text-gray-400" />
                    </div>
                    <Title level={4} className="dark:text-white !mb-2">Không tìm thấy kết quả nào</Title>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                        Rất tiếc, chúng tôi không tìm thấy kết quả nào phù hợp với từ khóa <strong>"{query}"</strong>.
                        Vui lòng thử lại với từ khóa khác.
                    </p>
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => window.history.back()}
                        icon={<ArrowLeft size={16} />}
                        className="rounded-xl h-12 px-8 flex items-center gap-2"
                    >
                        Quay lại trang trước
                    </Button>
                </Card>
            ) : (
                <div className="space-y-12">
                    {/* Projects Section */}
                    {hasProjects && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <LayoutGrid className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Dự án ({results.projects.length})</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {paginatedProjects.map((p) => (
                                    <ProjectCard key={p.id} project={p} gridCols={3} />
                                ))}
                            </div>
                            <PremiumPagination
                                current={projectPage}
                                total={results.projects.length}
                                pageSize={pageSize}
                                onChange={setProjectPage}
                            />
                        </section>
                    )}

                    {/* News Section */}
                    {hasNews && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <Newspaper className="w-5 h-5 text-green-600" />
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tin tức ({results.news.length})</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {paginatedNews.map((n) => (
                                    <NewsCard key={n.id} article={n} variant="grid" />
                                ))}
                            </div>
                            <PremiumPagination
                                current={newsPage}
                                total={results.news.length}
                                pageSize={pageSize}
                                onChange={setNewsPage}
                            />
                        </section>
                    )}

                    {/* Posts Section */}
                    {hasPosts && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <MessageSquare className="w-5 h-5 text-amber-600" />
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bài viết ({results.posts.length})</h2>
                            </div>
                            <div className="space-y-3">
                                {paginatedPosts.map((post) => (
                                    <PostSearchCard key={post.id} post={post} />
                                ))}
                            </div>
                            <PremiumPagination
                                current={postPage}
                                total={results.posts.length}
                                pageSize={pageSize}
                                onChange={setPostPage}
                            />
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <SiteLayout leftSidebar={<LeftWidgets />} hideRightSidebar hideFooter>
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Spin size="large" />
                </div>
            }>
                <SearchContent />
            </Suspense>
        </SiteLayout>
    );
}
