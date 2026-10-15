import { useState, type FC, type FormEvent, type ReactNode } from "react";

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
    <div className="min-h-screen w-full flex items-center justify-center bg-surface-muted px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border border-ink-200 rounded-xl shadow-sm p-8 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-lg font-semibold text-ink-900">Carete Demo</h1>
          <p className="text-sm text-ink-500">
            Enter the demo password to continue.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="demo-password"
            className="text-sm font-medium text-ink-700"
          >
            Password
          </label>
          <input
            id="demo-password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            className="h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
          />
          {error && (
            <p className="text-sm text-red-600">
              That password isn&apos;t right — try again.
            </p>
          )}
        </div>
        <button
          type="submit"
          className="h-10 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
        >
          Enter
        </button>
      </form>
    </div>
  );
};

export default DemoGate;
