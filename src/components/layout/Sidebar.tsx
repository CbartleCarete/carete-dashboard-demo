import type { FC } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  CreditCard,
  User,
  HelpCircle,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import careteLogo from "../../assets/carete_logo.png";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const mainNav: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/members", label: "Members", icon: Users },
  { to: "/referrals", label: "Referrals", icon: UserPlus },
  { to: "/claims", label: "Claims", icon: FileText },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

const otherNav: { label: string; icon: LucideIcon; to?: string }[] = [
  { label: "Settings", icon: Settings, to: "/settings" },
  { label: "Payment", icon: CreditCard },
  { label: "Accounts", icon: User },
  { label: "Help", icon: HelpCircle },
];

const linkBase =
  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors";
const linkIdle = "text-ink-500 hover:bg-brand-50 hover:text-brand-600";
const linkActive = "bg-brand-50 text-brand-600";

const Sidebar: FC = () => {
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 lg:w-64 shrink-0 bg-white border-r border-ink-200 py-6 px-4">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex items-center px-2 mb-8 cursor-pointer"
      >
        <img src={careteLogo} alt="Carete" className="h-9 w-auto" />
      </button>

      <nav className="flex flex-col gap-6 flex-1">
        <div>
          <span className="px-3 text-xs font-semibold tracking-wider text-ink-400">
            MENU
          </span>
          <ul className="mt-2 space-y-1">
            {mainNav.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkIdle}`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <span className="px-3 text-xs font-semibold tracking-wider text-ink-400">
            OTHERS
          </span>
          <ul className="mt-2 space-y-1">
            {otherNav.map(({ label, icon: Icon, to }) => (
              <li key={label}>
                {to ? (
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `${linkBase} ${isActive ? linkActive : linkIdle}`
                    }
                  >
                    <Icon size={18} />
                    {label}
                  </NavLink>
                ) : (
                  <span
                    className={`${linkBase} ${linkIdle} cursor-pointer`}
                  >
                    <Icon size={18} />
                    {label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
