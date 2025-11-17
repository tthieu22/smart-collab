import Link from 'next/link';
import SiteLayout from '@smart/components/layouts/SiteLayout';

export default function HomePage() {
  return (
    <SiteLayout>
      <section className="flex flex-col items-center justify-center h-full text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          🚀 Welcome to <span className="text-blue-600">Smart Collab</span>
        </h1>
        <p className="text-gray-600 max-w-xl">
          Tạo và quản lý dự án một cách dễ dàng, hợp tác nhóm thông minh để nâng cao hiệu quả làm việc.
        </p>
        <Link
          href="/projects"
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md"
        >
          Đi đến dự án của bạn
        </Link>
      </section>
    </SiteLayout>
  );
}
