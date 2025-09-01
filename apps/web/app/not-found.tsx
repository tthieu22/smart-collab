import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full text-center'>
        <div className='mb-6'>
          <h1 className='text-6xl font-bold text-gray-900 mb-4'>404</h1>
          <h2 className='text-2xl font-semibold text-gray-700 mb-2'>
            Page not found
          </h2>
          <p className='text-gray-600'>
            The page you're looking for doesn't exist.
          </p>
        </div>

        <div className='space-y-4'>
          <Link
            href='/'
            className='inline-block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
          >
            Go to homepage
          </Link>

          <Link
            href='/auth/login'
            className='inline-block w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors'
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
