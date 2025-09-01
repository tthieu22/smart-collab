'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full text-center'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Something went wrong!
          </h1>
          <p className='text-gray-600'>
            An error occurred while loading this page.
          </p>
        </div>

        <div className='space-y-4'>
          <button
            onClick={reset}
            className='w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
          >
            Try again
          </button>

          <button
            onClick={() => (window.location.href = '/')}
            className='w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors'
          >
            Go to homepage
          </button>
        </div>
      </div>
    </div>
  );
}
