'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // const { verifyEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill email from URL params if available
  useState(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    // try {
    //   const result = await verifyEmail(email, code);

    //   if (result.success) {
    //     setSuccess('Email verified successfully! You can now sign in.');
    //     setTimeout(() => router.push('/auth/login'), 2000);
    //   } else {
    //     setError(result.message || 'Verification failed');
    //   }
    // } catch (err) {
    //   setError('An unexpected error occurred');
    // } finally {
    //   setIsSubmitting(false);
    // }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Verify your email
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Enter the verification code sent to your email address
          </p>
        </div>

        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          <div className='rounded-md shadow-sm -space-y-px'>
            <div>
              <label htmlFor='email' className='sr-only'>
                Email address
              </label>
              <input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                required
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                placeholder='Email address'
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor='code' className='sr-only'>
                Verification code
              </label>
              <input
                id='code'
                name='code'
                type='text'
                autoComplete='off'
                required
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                placeholder='Verification code'
                value={code}
                onChange={e => setCode(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && (
            <div className='text-red-600 text-sm text-center bg-red-50 p-3 rounded-md'>
              {error}
            </div>
          )}

          {success && (
            <div className='text-green-600 text-sm text-center bg-green-50 p-3 rounded-md'>
              {success}
            </div>
          )}

          <div>
            <button
              type='submit'
              disabled={isSubmitting}
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isSubmitting ? (
                <div className='flex items-center'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Verifying...
                </div>
              ) : (
                'Verify Email'
              )}
            </button>
          </div>

          <div className='text-center'>
            <Link
              href='/auth/login'
              className='font-medium text-blue-600 hover:text-blue-500'
            >
              Back to login
            </Link>
          </div>
        </form>

        <div className='mt-6'>
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-300' />
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-2 bg-gray-50 text-gray-500'>Need help?</span>
            </div>
          </div>

          <div className='mt-6 text-center text-sm text-gray-600'>
            <p>
              Didn't receive a verification code?{' '}
              <Link
                href='/auth/resend-verification'
                className='font-medium text-blue-600 hover:text-blue-500'
              >
                Resend code
              </Link>
            </p>
            <p className='mt-2'>
              Or{' '}
              <Link
                href='/auth/register'
                className='font-medium text-blue-600 hover:text-blue-500'
              >
                create a new account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
