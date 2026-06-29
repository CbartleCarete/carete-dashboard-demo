import { useState, type FC } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Mail,
  Calendar,
  User,
  FileDown,
  Plus,
} from "lucide-react";
import { useMember } from "../data/membersStore";
import { addClaim, useMemberClaims } from "../data/claimsStore";
import StatusBadge from "../components/ui/StatusBadge";
import AddServiceModal from "../components/ui/AddServiceModal";
import EditMemberModal from "../components/ui/EditMemberModal";
import ExportInvoiceModal from "../components/ui/ExportInvoiceModal";

type Tab = "services" | "billing" | "documents";

const InfoItem: FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs uppercase tracking-wide text-ink-400">
      {label}
    </span>
    <span className="text-sm text-ink-700">{value || "—"}</span>
  </div>
);

const MemberDetails: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("services");
  const [exportOpen, setExportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const memberClaims = useMemberClaims(id ?? "");
  const member = useMember(id);

  if (!member) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <h2 className="text-lg font-semibold text-ink-900">Member not found</h2>
        <button
          onClick={() => navigate("/members")}
          className="mt-4 h-10 px-4 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition"
        >
          Back to Members
        </button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "services", label: "Services" },
    { id: "billing", label: "Billing" },
    { id: "documents", label: "Documents" },
  ];

  const addressLine = [member.address, member.city, member.zip]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate("/members")}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-500 hover:text-ink-700 transition w-fit"
      >
        <ArrowLeft size={18} />
        Back to Members
      </button>

      <div className="bg-white rounded-2xl border border-ink-200 shadow-sm p-6 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
              <User size={40} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-ink-900">
                {member.name}
              </h1>
              <p className="text-sm text-ink-500">Member ID: {member.id}</p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="text-xs uppercase tracking-wide text-ink-400">
              Managed Care Plan
            </div>
            <div className="text-sm font-medium text-ink-700">{member.mcp}</div>
            <StatusBadge status={member.status} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition"
          >
            <Edit size={16} />
            Edit Member
          </button>
          <button
            onClick={() => setAddServiceOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition"
          >
            <Plus size={16} />
            Add Service
          </button>
          <button
            onClick={() => setExportOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition"
          >
            <FileDown size={16} />
            New Claim
          </button>
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition">
            <Mail size={16} />
            Send Message
          </button>
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition">
            <Calendar size={16} />
            Schedule Appointment
          </button>
        </div>

        <div>
          <h3 className="text-base font-semibold text-ink-900 mb-4">
            Member Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
            <InfoItem label="Date of Birth" value={member.dob} />
            <InfoItem label="Client ID (CIN)" value={member.cin} />
            <InfoItem label="Managed Care Plan" value={member.mcp} />
            <InfoItem
              label="Homeless"
              value={member.homeless ? "Yes" : "No"}
            />
            <InfoItem label="Address" value={addressLine} />
            <InfoItem label="Last Service" value={member.lastService} />
          </div>
        </div>

        <div>
          <div className="flex border-b border-ink-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-600"
                    : "border-transparent text-ink-500 hover:text-ink-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="pt-6">
            {activeTab === "services" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-ink-900">
                      Services
                    </h3>
                    <p className="text-sm text-ink-500">
                      Services delivered to this member
                    </p>
                  </div>
                  <button
                    onClick={() => setAddServiceOpen(true)}
                    className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition"
                  >
                    <Plus size={16} />
                    Add Service
                  </button>
                </div>

                {memberClaims.length === 0 ? (
                  <p className="text-sm text-ink-500 bg-surface-muted rounded-lg p-4">
                    No services recorded yet. Use “Add Service” to log what was
                    delivered.
                  </p>
                ) : (
                  <ul className="flex flex-col divide-y divide-ink-200 border border-ink-200 rounded-lg">
                    {memberClaims.map((c) => (
                      <li
                        key={c.id}
                        className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] gap-3 p-4 items-center"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-ink-900 leading-snug">
                            {c.service}
                          </div>
                          <div className="text-xs text-ink-400">
                            {c.id} · {c.hcpcsCode} {c.modifiers.join(" ")}
                          </div>
                        </div>
                        <InfoItem
                          label="Dates"
                          value={
                            c.serviceEndDate &&
                            c.serviceEndDate !== c.serviceStartDate
                              ? `${c.serviceStartDate ?? c.serviceDate} → ${c.serviceEndDate}`
                              : c.serviceStartDate ?? c.serviceDate
                          }
                        />
                        <InfoItem
                          label="Charge"
                          value={
                            c.chargeAmount
                              ? `$${c.chargeAmount.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                })}`
                              : ""
                          }
                        />
                        <StatusBadge status={c.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {activeTab === "billing" && (
              <div>
                <h3 className="text-base font-semibold text-ink-900">
                  Billing Information
                </h3>
                <p className="text-sm text-ink-500">Coming soon...</p>
              </div>
            )}
            {activeTab === "documents" && (
              <div>
                <h3 className="text-base font-semibold text-ink-900">
                  Documents
                </h3>
                <p className="text-sm text-ink-500">Coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {addServiceOpen && (
        <AddServiceModal
          isOpen={addServiceOpen}
          member={member}
          existingClaims={memberClaims}
          onAddService={addClaim}
          onClose={() => setAddServiceOpen(false)}
        />
      )}

      {editOpen && (
        <EditMemberModal member={member} onClose={() => setEditOpen(false)} />
      )}

      {exportOpen && (
        <ExportInvoiceModal
          member={member}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
};

export default MemberDetails;
