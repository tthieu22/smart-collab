"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Layout, Row, Col, Typography, Card, Tag, Button, Empty, Spin, Divider } from "antd";
import { ProjectOutlined, GlobalOutlined, FileTextOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { searchService, SearchResults } from "@smart/services/search.service";
import Link from "next/link";

const { Title, Text, Paragraph } = Typography;

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    const [results, setResults] = useState<SearchResults>({ projects: [], news: [], posts: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const doSearch = async () => {
            if (!query) return;
            setLoading(true);
            try {
                const data = await searchService.search(query);
                setResults(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        doSearch();
    }, [query]);

    const renderProjectCard = (p: any) => (
        <Card
            key={p.id}
            hoverable
            style={{ marginBottom: 16, borderRadius: 12 }}
            bodyStyle={{ padding: 20 }}
            actions={[
                <Link href={`/projects/${p.id}`}>
                    Chi tiết <ArrowRightOutlined />
                </Link>
            ]}
        >
            <Card.Meta
                title={<Title level={5}>{p.name}</Title>}
                description={
                    <Paragraph ellipsis={{ rows: 2 }}>
                        {p.description || "Không có mô tả cho dự án này."}
                    </Paragraph>
                }
            />
            <div style={{ marginTop: 12 }}>
                <Tag color={p.visibility === 'PUBLIC' ? 'green' : 'blue'}>{p.visibility}</Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>{new Date(p.createdAt).toLocaleDateString()}</Text>
            </div>
        </Card>
    );

    const renderNewsCard = (n: any) => (
        <Card
            key={n.id}
            hoverable
            style={{ marginBottom: 16, borderRadius: 12 }}
            cover={n.media?.[0]?.url && <img alt="news" src={n.media[0].url} style={{ height: 180, objectFit: 'cover' }} />}
            actions={[
                <Link href={`/news/${n.id}`}>
                    Đọc tiếp <ArrowRightOutlined />
                </Link>
            ]}
        >
            <Card.Meta
                title={n.title}
                description={
                    <Paragraph ellipsis={{ rows: 3 }}>
                        {n.content}
                    </Paragraph>
                }
            />
        </Card>
    );

    const renderPostCard = (p: any) => (
        <Card
            key={p.id}
            hoverable
            style={{ marginBottom: 16, borderRadius: 12 }}
            actions={[
                <Link href={`/posts/${p.id}`}>
                    Phản hồi <ArrowRightOutlined />
                </Link>
            ]}
        >
            <Title level={5}>{p.title || "Bài viết mới"}</Title>
            <Paragraph ellipsis={{ rows: 4 }}>
                {p.content}
            </Paragraph>
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Đăng lúc: {new Date(p.createdAt).toLocaleString()}</Text>
        </Card>
    );

    if (loading) {
        return (
            <div style={{ padding: '100px 0', textAlign: 'center' }}>
                <Spin size="large" tip="Đang tìm kiếm dữ liệu thông minh..." />
            </div>
        );
    }

    const noResults = !results.projects.length && !results.news.length && !results.posts.length;

    return (
        <div style={{ padding: '0 24px 48px' }}>
            <div style={{ marginBottom: 32 }}>
                <Title level={2}>Kết quả tìm kiếm cho: <span style={{ color: '#1890ff' }}>"{query}"</span></Title>
                <Text type="secondary">
                    Tìm thấy {results.projects.length + results.news.length + results.posts.length} kết quả phù hợp.
                </Text>
            </div>

            {noResults ? (
                <Empty
                    image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                    imageStyle={{ height: 200 }}
                    description={
                        <span>
                            Rất tiếc, chúng tôi không tìm thấy kết quả nào phù hợp với <strong>"{query}"</strong>.
                            <br />
                            Vui lòng thử lại với từ khóa khác.
                        </span>
                    }
                >
                    <Button type="primary" onClick={() => window.history.back()}>Quay lại</Button>
                </Empty>
            ) : (
                <Row gutter={32}>
                    <Col xs={24} lg={8}>
                        <Title level={4}><ProjectOutlined /> Dự án ({results.projects.length})</Title>
                        <Divider style={{ margin: '12px 0 24px' }} />
                        {results.projects.length > 0 ? (
                            results.projects.map(renderProjectCard)
                        ) : (
                            <Empty description="Không tìm thấy dự án" />
                        )}
                    </Col>

                    <Col xs={24} lg={8}>
                        <Title level={4}><GlobalOutlined /> Tin tức ({results.news.length})</Title>
                        <Divider style={{ margin: '12px 0 24px' }} />
                        {results.news.length > 0 ? (
                            results.news.map(renderNewsCard)
                        ) : (
                            <Empty description="Không tìm thấy tin tức" />
                        )}
                    </Col>

                    <Col xs={24} lg={8}>
                        <Title level={4}><FileTextOutlined /> Bài viết ({results.posts.length})</Title>
                        <Divider style={{ margin: '12px 0 24px' }} />
                        {results.posts.length > 0 ? (
                            results.posts.map(renderPostCard)
                        ) : (
                            <Empty description="Không tìm thấy bài viết" />
                        )}
                    </Col>
                </Row>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Layout style={{ minHeight: '100vh', background: '#fff' }}>
            <Suspense fallback={<Spin size="large" />}>
                <SearchContent />
            </Suspense>
        </Layout>
    );
}
