'use client';

import AuthGuard from '../components/auth/AuthGuard';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/ui/loading';
import { ROUTES } from '../lib/constants';
import { useRouter } from 'next/navigation';

function DashboardContent() {
  const { user, logout, logoutAll, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <Loading />;
  }

  const handleProfileSettings = () => {
    router.push(ROUTES.PROFILE);
  };

  const handleSecurity = () => {
    router.push(ROUTES.SETTINGS);
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='px-4 py-6 sm:px-0'>
          <div className='flex justify-between items-center'>
            <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
            <div className='flex space-x-3'>
              <button
                onClick={logout}
                className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                Logout
              </button>
              <button
                onClick={logoutAll}
                className='inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
              >
                Logout All Devices
              </button>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className='px-4 py-6 sm:px-0'>
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='px-4 py-5 sm:p-6'>
              <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                User Information
              </h3>

              {user && (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  <div>
                    <dt className='text-sm font-medium text-gray-500'>Email</dt>
                    <dd className='mt-1 text-sm text-gray-900'>{user.email}</dd>
                  </div>

                  <div>
                    <dt className='text-sm font-medium text-gray-500'>Role</dt>
                    <dd className='mt-1 text-sm text-gray-900 capitalize'>
                      {user.role}
                    </dd>
                  </div>

                  <div>
                    <dt className='text-sm font-medium text-gray-500'>
                      First Name
                    </dt>
                    <dd className='mt-1 text-sm text-gray-900'>
                      {user.firstName || 'Not provided'}
                    </dd>
                  </div>

                  <div>
                    <dt className='text-sm font-medium text-gray-500'>
                      Last Name
                    </dt>
                    <dd className='mt-1 text-sm text-gray-900'>
                      {user.lastName || 'Not provided'}
                    </dd>
                  </div>

                  <div>
                    <dt className='text-sm font-medium text-gray-500'>
                      Email Verified
                    </dt>
                    <dd className='mt-1 text-sm text-gray-900'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isVerified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className='text-sm font-medium text-gray-500'>
                      Member Since
                    </dt>
                    <dd className='mt-1 text-sm text-gray-900'>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='px-4 py-6 sm:px-0'>
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='px-4 py-5 sm:p-6'>
              <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                Quick Actions
              </h3>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                <button
                  onClick={handleProfileSettings}
                  className='relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300'
                >
                  <div>
                    <span className='rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white'>
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
                          d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                        />
                      </svg>
                    </span>
                  </div>
                  <div className='mt-8'>
                    <h3 className='text-lg font-medium'>
                      <span className='absolute inset-0' aria-hidden='true' />
                      Profile Settings
                    </h3>
                    <p className='mt-2 text-sm text-gray-500'>
                      Update your profile information and preferences
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleSecurity}
                  className='relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300'
                >
                  <div>
                    <span className='rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white'>
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
                    </span>
                  </div>
                  <div className='mt-8'>
                    <h3 className='text-lg font-medium'>
                      <span className='absolute inset-0' aria-hidden='true' />
                      Security
                    </h3>
                    <p className='mt-2 text-sm text-gray-500'>
                      Manage your password and security settings
                    </p>
                  </div>
                </button>

                <button className='relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300'>
                  <div>
                    <span className='rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white'>
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
                          d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                        />
                      </svg>
                    </span>
                  </div>
                  <div className='mt-8'>
                    <h3 className='text-lg font-medium'>
                      <span className='absolute inset-0' aria-hidden='true' />
                      Analytics
                    </h3>
                    <p className='mt-2 text-sm text-gray-500'>
                      View your account statistics and activity
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
