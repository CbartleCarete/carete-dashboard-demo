import { useState, type FC } from "react";
import { Save, Check } from "lucide-react";
import {
  loadOrgSettings,
  saveOrgSettings,
  type OrgSettings,
  type ProviderIdentity,
} from "../data/orgSettings";
import { payers } from "../data/payers";

const fieldLabel = "text-sm font-medium text-ink-700";
const fieldControl =
  "h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition w-full";

const PROVIDER_FIELDS: { key: keyof ProviderIdentity; label: string }[] = [
  { key: "npi", label: "National Provider Identifier (NPI)" },
  { key: "tin", label: "Tax Identification Number (TIN)" },
  { key: "orgName", label: "Last / Organization name" },
  { key: "firstName", label: "Provider first name" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "zip", label: "ZIP" },
  { key: "phone", label: "Phone number" },
];

const Settings: FC = () => {
  const [settings, setSettings] = useState<OrgSettings>(loadOrgSettings);
  const [saved, setSaved] = useState(false);

  const setBilling = (key: keyof ProviderIdentity, value: string) =>
    setSettings((s) => ({ ...s, billing: { ...s.billing, [key]: value } }));

  const setRendering = (key: keyof ProviderIdentity, value: string) =>
    setSettings((s) => ({ ...s, rendering: { ...s.rendering, [key]: value } }));

  const setPayorId = (payerId: string, value: string) =>
    setSettings((s) => ({
      ...s,
      payorPrimaryIds: { ...s.payorPrimaryIds, [payerId]: value },
    }));

  const handleSave = () => {
    saveOrgSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500 mt-1">
          Provider identity used to auto-fill payer claim forms. Entered once,
          stored on this device.
        </p>
      </div>

      <section className="bg-white rounded-2xl border border-ink-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-ink-900 mb-1">
          Billing Provider
        </h2>
        <p className="text-sm text-ink-500 mb-4">
          Required. Used in Section 1a of every invoice.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PROVIDER_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className={fieldLabel}>{label}</label>
              <input
                className={fieldControl}
                value={settings.billing[key]}
                onChange={(e) => setBilling(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-ink-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-ink-900 mb-1">
          Rendering Provider
        </h2>
        <p className="text-sm text-ink-500 mb-4">
          Optional. Any field left blank falls back to the billing provider.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PROVIDER_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className={fieldLabel}>{label}</label>
              <input
                className={fieldControl}
                value={settings.rendering[key] ?? ""}
                onChange={(e) => setRendering(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-ink-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-ink-900 mb-1">
          Payor Primary IDs
        </h2>
        <p className="text-sm text-ink-500 mb-4">
          Your contracted provider ID with each payer.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {payers.map((p) => (
            <div key={p.id} className="flex flex-col gap-1.5">
              <label className={fieldLabel}>{p.name}</label>
              <input
                className={fieldControl}
                value={settings.payorPrimaryIds[p.id] ?? ""}
                onChange={(e) => setPayorId(p.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition"
        >
          {saved ? <Check size={18} /> : <Save size={18} />}
          {saved ? "Saved" : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

export default Settings;
