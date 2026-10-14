import type { FC } from "react";
import { Search } from "lucide-react";
import UserMenu from "../ui/UserMenu";

const Header: FC = () => {
  return (
    <header className="flex items-center justify-between gap-4 h-16 px-6 bg-white border-b border-ink-200">
      <div className="relative flex-1 max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
        />
        <input
          type="text"
          placeholder="Search"
          className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-muted border border-ink-200 text-sm text-ink-700 placeholder:text-ink-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
        />
      </div>
      <UserMenu />
    </header>
  );
};

export default Header;
