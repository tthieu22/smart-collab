# Frontend Architecture

## Cấu trúc thư mục

```
app/
├── lib/
│   ├── constants.ts      # Constants và configuration
│   └── index.ts          # Export tất cả
├── types/
│   ├── auth.ts           # Auth types
│   └── user.ts           # User types
├── services/
│   ├── auth.service.ts   # Auth API service
│   └── user.service.ts   # User API service
├── store/
│   ├── auth.ts           # Auth state management (Zustand)
│   └── user.ts           # User state management (Zustand)
├── hooks/
│   ├── useAuth.ts        # Auth hook
│   └── useUser.ts        # User hook
└── components/
    ├── auth/
    │   └── AuthGuard.tsx # Route protection
    └── ui/
        └── loading.tsx   # Loading component
```

## Sử dụng

### Authentication

```tsx
import { useAuth } from '@/hooks/useAuth';

function LoginComponent() {
  const { login, isLoading, user } = useAuth();

  const handleLogin = async () => {
    const result = await login({ email, password });
    if (result.success) {
      // Redirect to dashboard
    }
  };
}
```

### User Management

```tsx
import { useUser } from '@/hooks/useUser';

function ProfileComponent() {
  const { currentUser, updateMe, changePassword, isLoading } = useUser();

  const handleUpdateProfile = async () => {
    const result = await updateMe({ firstName, lastName });
    if (result.success) {
      // Profile updated
    }
  };
}
```

### Admin Functions

```tsx
import { useUser } from '@/hooks/useUser';

function AdminComponent() {
  const { allUsers, getAllUsers, createUser, updateUserById, deleteUserById } =
    useUser();

  // Load all users
  useEffect(() => {
    getAllUsers();
  }, []);

  // Create new user
  const handleCreateUser = async () => {
    const result = await createUser({ email, password, firstName, lastName });
  };
}
```

## Features

### Auth Store

- Quản lý access token
- Authentication state
- Loading state
- Không lưu vào localStorage (chỉ memory)

### User Store

- Quản lý current user
- Quản lý danh sách users (admin)
- Loading và error state
- CRUD operations

### Services

- Tương thích với backend API
- Error handling
- Type safety
- Automatic token refresh

### Hooks

- useAuth: Authentication operations
- useUser: User management operations
- Automatic state synchronization
- Error handling

## API Endpoints

### Auth

- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- POST /auth/logout-all
- GET /auth/me
- POST /auth/oauth/exchange
- POST /auth/verify-email
- POST /auth/validate-user

### User

- POST /users (admin)
- GET /users (admin)
- GET /users/me
- PATCH /users/me
- PATCH /users/:id (admin)
- DELETE /users/:id (admin)
- POST /users/resend-verification-code
- POST /users/verify-email
- PATCH /users/me/change-password
