import { SetMetadata } from '@nestjs/common';

// Key metadata dùng cho roles
export const ROLES_KEY = 'roles';

// Decorator @Roles dùng để gán roles cho route hoặc controller
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Key metadata dùng cho public route
export const IS_PUBLIC_KEY = 'isPublic';

// Decorator @Public dùng để đánh dấu route là public (bỏ qua auth guard)
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
