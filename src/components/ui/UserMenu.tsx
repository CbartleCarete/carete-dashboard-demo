import type { FC, ReactNode } from "react";
import { Bell } from "lucide-react";

interface UserMenuProps {
  avatar?: ReactNode;
  displayName?: string;
}

const UserMenu: FC<UserMenuProps> = ({
  avatar = "🍎",
  displayName = "Unity Roots",
}) => {
  return (
    <div className="relative flex items-center gap-3">
      <button
        type="button"
        className="relative p-2 rounded-full text-ink-500 hover:bg-surface-muted transition"
        aria-label="Notifications"
      >
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />
      </button>

      <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full">
        <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-sm">
          {avatar}
        </div>
        <span className="text-sm font-medium text-ink-700">{displayName}</span>
      </div>
    </div>
  );
};

export default UserMenu;
