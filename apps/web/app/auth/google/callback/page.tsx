'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';

export default function GoogleCallbackPage() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>(
    'processing'
  );
  const [message, setMessage] = useState('Processing OAuth callback...');

  const { oauthExchange } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received from Google');
        setTimeout(() => router.push('/auth/login'), 3000);
        return;
      }

      try {
        setStatus('processing');
        setMessage('Exchanging authorization code for access token...');

        const result = await oauthExchange(code);

        if (result.success) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting to dashboard...');
          // Redirect will be handled by useAuth hook
        } else {
          setStatus('error');
          setMessage(result.message || 'OAuth exchange failed');
          setTimeout(() => router.push('/auth/login'), 3000);
        }
      } catch (error) {
        setStatus('error');
        setMessage('An unexpected error occurred during OAuth exchange');
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, oauthExchange, router]);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return (
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
        );
      case 'success':
        return (
          <div className='rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mx-auto mb-4'>
            <svg
              className='h-8 w-8 text-green-600'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className='rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mx-auto mb-4'>
            <svg
              className='h-8 w-8 text-red-600'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </div>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          {getStatusIcon()}

          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            {status === 'processing' && 'Processing...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Error'}
          </h2>

          <p className={`text-lg ${getStatusColor()}`}>{message}</p>

          {status === 'error' && (
            <div className='mt-6'>
              <button
                onClick={() => router.push('/auth/login')}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
