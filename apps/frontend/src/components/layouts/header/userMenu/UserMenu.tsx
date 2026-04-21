import { NotificationMenu } from "./NotificationMenu";
import { AvatarMenu } from "./AvatarMenu";

export function UserMenu() {
  return (
    <div className="flex items-center gap-4">
      <NotificationMenu />
      <AvatarMenu />
    </div>
  );
}
