'use client';

import UserProfilePage from '@smart/components/home/profile/UserProfilePage';

export default function UserProfileByIdPage({
  params,
}: {
  params: { userId: string };
}) {
  return <UserProfilePage userId={params.userId} />;
}

