'use client';

import Link from 'next/link';
import { useAuth } from './hooks/useAuth';
import AuthGuard from './components/auth/AuthGuard';
import { ROUTES } from './lib/constants';

function HomePageContent() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Navigation */}
      <nav className='bg-white shadow-sm'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <h1 className='text-xl font-bold text-gray-900'>AuthNexus</h1>
            </div>
            <div className='flex items-center space-x-4'>
              {isAuthenticated ? (
                <>
                  <span className='text-sm text-gray-700'>
                    Welcome, {user?.firstName || user?.email}
                  </span>
                  <Link
                    href={ROUTES.DASHBOARD}
                    className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={ROUTES.LOGIN}
                    className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    Sign In
                  </Link>
                  <Link
                    href={ROUTES.REGISTER}
                    className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className='relative bg-white overflow-hidden'>
        <div className='max-w-7xl mx-auto'>
          <div className='relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32'>
            <main className='mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28'>
              <div className='sm:text-center lg:text-left'>
                <h1 className='text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl'>
                  <span className='block xl:inline'>Secure Authentication</span>{' '}
                  <span className='block text-blue-600 xl:inline'>
                    for Modern Apps
                  </span>
                </h1>
                <p className='mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0'>
                  Build secure, scalable authentication systems with our
                  comprehensive solution. Support for JWT tokens, OAuth
                  providers, and advanced security features.
                </p>
                <div className='mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start'>
                  {isAuthenticated ? (
                    <Link
                      href={ROUTES.DASHBOARD}
                      className='w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10'
                    >
                      Go to Dashboard
                    </Link>
                  ) : (
                    <>
                      <div className='rounded-md shadow'>
                        <Link
                          href={ROUTES.LOGIN}
                          className='w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10'
                        >
                          Get started
                        </Link>
                      </div>
                      <div className='mt-3 sm:mt-0 sm:ml-3'>
                        <Link
                          href={ROUTES.REGISTER}
                          className='w-full flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10'
                        >
                          Sign up
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className='lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2'>
          <div className='h-56 w-full bg-blue-600 sm:h-72 md:h-96 lg:w-full lg:h-full'></div>
        </div>
      </div>

      {/* Features Section */}
      <div className='py-12 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='lg:text-center'>
            <h2 className='text-base text-blue-600 font-semibold tracking-wide uppercase'>
              Features
            </h2>
            <p className='mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl'>
              Everything you need for secure authentication
            </p>
            <p className='mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto'>
              Our authentication system provides enterprise-grade security with
              developer-friendly APIs.
            </p>
          </div>

          <div className='mt-10'>
            <div className='space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10'>
              <div className='relative'>
                <div className='absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white'>
                  <svg
                    className='h-6 w-6'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                    />
                  </svg>
                </div>
                <p className='ml-16 text-lg leading-6 font-medium text-gray-900'>
                  JWT Authentication
                </p>
                <p className='mt-2 ml-16 text-base text-gray-500'>
                  Secure token-based authentication with automatic refresh and
                  expiration handling.
                </p>
              </div>

              <div className='relative'>
                <div className='absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white'>
                  <svg
                    className='h-6 w-6'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0-9c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9'
                    />
                  </svg>
                </div>
                <p className='ml-16 text-lg leading-6 font-medium text-gray-900'>
                  OAuth Integration
                </p>
                <p className='mt-2 ml-16 text-base text-gray-500'>
                  Seamless integration with Google, GitHub, and other OAuth
                  providers.
                </p>
              </div>

              <div className='relative'>
                <div className='absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white'>
                  <svg
                    className='h-6 w-6'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                    />
                  </svg>
                </div>
                <p className='ml-16 text-lg leading-6 font-medium text-gray-900'>
                  Role-Based Access
                </p>
                <p className='mt-2 ml-16 text-base text-gray-500'>
                  Flexible role-based access control with customizable
                  permissions.
                </p>
              </div>

              <div className='relative'>
                <div className='absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white'>
                  <svg
                    className='h-6 w-6'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                    />
                  </svg>
                </div>
                <p className='ml-16 text-lg leading-6 font-medium text-gray-900'>
                  Email Verification
                </p>
                <p className='mt-2 ml-16 text-base text-gray-500'>
                  Secure email verification system with customizable templates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthGuard requireAuth={false} redirectTo={ROUTES.DASHBOARD}>
      <HomePageContent />
    </AuthGuard>
  );
}
