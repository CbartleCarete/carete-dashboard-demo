import { useState, type FC, type FormEvent, type ReactNode } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import careteLogo from "../assets/carete_logo.png";

const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || "carete-demo";
const SESSION_KEY = "carete-demo-unlocked";

interface DemoGateProps {
  children: ReactNode;
}

const DemoGate: FC<DemoGateProps> = ({ children }) => {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true"
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === DEMO_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-page px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border border-ink-200 rounded-2xl shadow-lg p-8 flex flex-col gap-6"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <img src={careteLogo} alt="Carete" className="h-10 w-auto" />
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold text-ink-900">
              Sign in to continue
            </h1>
            <p className="text-sm text-ink-500">
              Enter the demo password to continue.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="demo-password"
            className="text-sm font-medium text-ink-700"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              id="demo-password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="h-11 w-full rounded-lg border border-ink-200 bg-surface-muted pl-9 pr-3 text-sm text-ink-700 transition focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">
              That password isn&apos;t right — try again.
            </p>
          )}
        </div>

        <button
          type="submit"
          className="h-11 rounded-lg bg-accent-600 text-sm font-semibold text-white transition hover:brightness-95"
        >
          Enter
        </button>

        <div className="flex items-start gap-3 rounded-lg border border-ink-200 bg-surface-muted p-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
          <p className="text-xs leading-snug text-ink-500">
            This is a private demo environment. Reach out to your Carete
            contact if you need the password.
          </p>
        </div>
      </form>
    </div>
  );
};

export default DemoGate;
