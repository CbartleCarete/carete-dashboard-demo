import { useState, type FC } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Mail,
  Calendar,
  User,
  FileDown,
  Plus,
  UserPlus,
} from "lucide-react";
import { useMember } from "../data/membersStore";
import { addClaim, useMemberClaims, type Claim } from "../data/claimsStore";
import { addMessage, useMemberMessages } from "../data/messagesStore";
import {
  addAppointment,
  useMemberAppointments,
  type Appointment,
} from "../data/appointmentsStore";
import {
  addReferral,
  decideReferral,
  markReferralScheduled,
  markReferralClaimed,
  useMemberReferrals,
  useReferrals,
  OUTCOME_TYPE_LABELS,
  type Referral,
} from "../data/referralsStore";
import type { Service } from "../data/dhcsCodes";
import type { MessageChannel, MessageRecipient } from "../data/messagesStore";
import StatusBadge from "../components/ui/StatusBadge";
import AddServiceModal from "../components/ui/AddServiceModal";
import EditMemberModal from "../components/ui/EditMemberModal";
import ExportInvoiceModal from "../components/ui/ExportInvoiceModal";
import SendMessageModal from "../components/ui/SendMessageModal";
import ScheduleAppointmentModal from "../components/ui/ScheduleAppointmentModal";
import PriorAuthorizationRequestModal from "../components/ui/PriorAuthorizationRequestModal";
import NewReferralModal from "../components/ui/NewReferralModal";
import CloseReferralModal from "../components/ui/CloseReferralModal";

type Tab = "services" | "billing" | "referrals" | "documents";
const TAB_IDS: Tab[] = ["referrals", "services", "billing", "documents"];

const pad = (n: number) => String(n).padStart(2, "0");
const todayDisplay = () => {
  const d = new Date();
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`;
};

const REFERRAL_STATUS_STYLES: Record<Referral["status"], string> = {
  pending: "bg-status-pending-bg text-status-pending-fg",
  accepted: "bg-accent-50 text-accent-600",
  scheduled: "bg-brand-50 text-brand-600",
  claimed: "bg-surface-muted text-ink-500",
  closed: "bg-status-success-bg text-status-success-fg",
};

const REFERRAL_STATUS_LABEL: Record<Referral["status"], string> = {
  pending: "Pending Decision",
  accepted: "Accepted",
  scheduled: "Scheduled",
  claimed: "Claimed",
  closed: "Closed",
};

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
  const [searchParams] = useSearchParams();
  const initialTab =
    TAB_IDS.find((t) => t === searchParams.get("tab")) ?? "services";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [exportOpen, setExportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [priorAuthFormOpen, setPriorAuthFormOpen] = useState(false);
  const [priorAuthService, setPriorAuthService] = useState<Service | null>(
    null
  );
  const [messagePrefill, setMessagePrefill] = useState<{
    recipient: MessageRecipient;
    channel: MessageChannel;
    subject: string;
    body: string;
  } | null>(null);
  const [newReferralOpen, setNewReferralOpen] = useState(false);
  const [closingReferral, setClosingReferral] = useState<Referral | null>(
    null
  );
  const [scheduleReferralId, setScheduleReferralId] = useState<string | null>(
    null
  );
  const [claimReferralId, setClaimReferralId] = useState<string | null>(
    null
  );
  const memberClaims = useMemberClaims(id ?? "");
  const memberMessages = useMemberMessages(id ?? "");
  const memberAppointments = useMemberAppointments(id ?? "");
  const memberReferrals = useMemberReferrals(id ?? "");
  const allReferrals = useReferrals();
  const scheduleReferral = scheduleReferralId
    ? memberReferrals.find((r) => r.id === scheduleReferralId) ?? null
    : null;
  const claimReferral = claimReferralId
    ? memberReferrals.find((r) => r.id === claimReferralId) ?? null
    : null;
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
    { id: "referrals", label: "Referrals" },
    { id: "services", label: "Services" },
    { id: "billing", label: "Billing" },
    { id: "documents", label: "Documents" },
  ];

  const addressLine = [member.address, member.city, member.zip]
    .filter(Boolean)
    .join(", ");

  const handleOpenPriorAuthForm = (service: Service) => {
    setPriorAuthService(service);
    setPriorAuthFormOpen(true);
  };

  const handleScheduleAppointment = (appointment: Appointment) => {
    addAppointment(appointment);
    if (scheduleReferralId) {
      markReferralScheduled(
        scheduleReferralId,
        appointment.id,
        appointment.scheduledOn
      );
      setScheduleReferralId(null);
    }
  };

  const handleScheduleFromReferral = (referral: Referral) => {
    setScheduleReferralId(referral.id);
    setScheduleOpen(true);
  };

  const handleAddService = (claim: Claim) => {
    addClaim(claim);
    if (claimReferralId) {
      markReferralClaimed(claimReferralId, claim.id, todayDisplay());
      setClaimReferralId(null);
    }
  };

  const handleCreateClaimFromReferral = (referral: Referral) => {
    setClaimReferralId(referral.id);
    setAddServiceOpen(true);
  };

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
            onClick={() => {
              setClaimReferralId(null);
              setAddServiceOpen(true);
            }}
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
          <button
            onClick={() => setSendMessageOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition"
          >
            <Mail size={16} />
            Send Message
          </button>
          <button
            onClick={() => {
              setScheduleReferralId(null);
              setScheduleOpen(true);
            }}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition"
          >
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
            <InfoItem
              label="Health Plan Member ID"
              value={member.healthPlanMemberId}
            />
            <InfoItem label="Managed Care Plan" value={member.mcp} />
            <InfoItem label="Phone" value={member.phone} />
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
                    onClick={() => {
                      setClaimReferralId(null);
                      setAddServiceOpen(true);
                    }}
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
            {activeTab === "referrals" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-ink-900">
                      Referrals
                    </h3>
                    <p className="text-sm text-ink-500">
                      Referrals to outside services, from screening finding
                      to closed outcome
                    </p>
                  </div>
                  <button
                    onClick={() => setNewReferralOpen(true)}
                    className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition"
                  >
                    <UserPlus size={16} />
                    New Referral
                  </button>
                </div>

                {memberReferrals.length === 0 ? (
                  <p className="text-sm text-ink-500 bg-surface-muted rounded-lg p-4">
                    No referrals recorded yet. Use “New Referral” to refer
                    this member to an outside service.
                  </p>
                ) : (
                  <ul className="flex flex-col divide-y divide-ink-200 border border-ink-200 rounded-lg">
                    {memberReferrals.map((r) => (
                      <li key={r.id} className="p-4 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-ink-900 leading-snug">
                              {r.serviceLabel}
                            </div>
                            <div className="text-xs text-ink-400">
                              {r.id} · Referred {r.createdOn}
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium whitespace-nowrap ${REFERRAL_STATUS_STYLES[r.status]}`}
                          >
                            {REFERRAL_STATUS_LABEL[r.status]}
                          </span>
                        </div>

                        <p className="text-sm text-ink-700">{r.reason}</p>

                        <div className="text-xs text-ink-500">
                          Options presented:{" "}
                          {r.optionsPresented
                            .map((o) => o.providerName)
                            .join(", ")}
                        </div>

                        {r.status === "pending" && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {r.optionsPresented.map((o) => (
                              <button
                                key={o.providerId}
                                onClick={() =>
                                  decideReferral(r.id, todayDisplay(), {
                                    providerId: o.providerId,
                                    providerName: o.providerName,
                                  })
                                }
                                className="h-8 px-3 rounded-lg border border-ink-200 text-xs font-medium text-ink-700 hover:bg-surface-muted transition"
                              >
                                Consumer chose {o.providerName}
                              </button>
                            ))}
                            <button
                              onClick={() =>
                                decideReferral(r.id, todayDisplay(), null)
                              }
                              className="h-8 px-3 rounded-lg border border-ink-200 text-xs font-medium text-ink-500 hover:bg-surface-muted transition"
                            >
                              Decline all options
                            </button>
                          </div>
                        )}

                        {r.status === "accepted" && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <p className="text-xs text-ink-500">
                              Consumer selected {r.chosenProviderName} on{" "}
                              {r.decidedOn}.
                            </p>
                            <button
                              onClick={() => handleScheduleFromReferral(r)}
                              className="inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-brand-500 text-xs font-medium text-white hover:bg-brand-600 transition"
                            >
                              <Calendar size={14} />
                              Schedule Appointment
                            </button>
                          </div>
                        )}

                        {r.status === "scheduled" && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <p className="text-xs text-ink-500">
                              Scheduled with {r.chosenProviderName} on{" "}
                              {r.scheduledOn}
                              {r.appointmentId
                                ? ` · Appointment ${r.appointmentId}`
                                : ""}
                              .
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCreateClaimFromReferral(r)}
                                className="inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-brand-500 text-xs font-medium text-white hover:bg-brand-600 transition"
                              >
                                <Plus size={14} />
                                Create Claim
                              </button>
                              <button
                                onClick={() => setClosingReferral(r)}
                                className="h-8 px-3 rounded-lg border border-ink-200 text-xs font-medium text-ink-700 hover:bg-surface-muted transition"
                              >
                                Close Referral
                              </button>
                            </div>
                          </div>
                        )}

                        {r.status === "claimed" && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="text-xs text-ink-500">
                              <p>
                                Claimed on {r.claimedOn}
                                {r.claimId ? ` · Claim ${r.claimId}` : ""}.
                              </p>
                              {(() => {
                                const linkedClaim = memberClaims.find(
                                  (c) => c.id === r.claimId
                                );
                                return linkedClaim ? (
                                  <div className="mt-1 flex items-center gap-2">
                                    <span>Claim status:</span>
                                    <StatusBadge status={linkedClaim.status} />
                                  </div>
                                ) : null;
                              })()}
                              <p className="mt-1">
                                Closes automatically once that claim is paid.
                              </p>
                            </div>
                            <button
                              onClick={() => setClosingReferral(r)}
                              className="h-8 px-3 rounded-lg border border-ink-200 text-xs font-medium text-ink-700 hover:bg-surface-muted transition"
                            >
                              Close Referral
                            </button>
                          </div>
                        )}

                        {r.status === "closed" && (
                          <p className="text-xs text-ink-500">
                            {r.outcomeType
                              ? OUTCOME_TYPE_LABELS[r.outcomeType]
                              : "Closed"}
                            {r.closedOn ? ` on ${r.closedOn}` : ""}
                            {r.outcome ? ` — ${r.outcome}` : ""}
                          </p>
                        )}
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
          onAddService={handleAddService}
          onClose={() => {
            setAddServiceOpen(false);
            setClaimReferralId(null);
          }}
          initialServiceId={claimReferral?.serviceId}
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

      {sendMessageOpen && (
        <SendMessageModal
          isOpen={sendMessageOpen}
          member={member}
          existingMessages={memberMessages}
          onSend={addMessage}
          onClose={() => {
            setSendMessageOpen(false);
            setMessagePrefill(null);
          }}
          initialRecipient={messagePrefill?.recipient}
          initialChannel={messagePrefill?.channel}
          initialSubject={messagePrefill?.subject}
          initialBody={messagePrefill?.body}
        />
      )}

      {scheduleOpen && (
        <ScheduleAppointmentModal
          isOpen={scheduleOpen}
          member={member}
          existingAppointments={memberAppointments}
          onSchedule={handleScheduleAppointment}
          onOpenPriorAuthForm={handleOpenPriorAuthForm}
          onClose={() => {
            setScheduleOpen(false);
            setScheduleReferralId(null);
          }}
          initialServiceId={scheduleReferral?.serviceId}
          initialProviderId={scheduleReferral?.chosenProviderId}
        />
      )}

      {newReferralOpen && (
        <NewReferralModal
          isOpen={newReferralOpen}
          member={member}
          existingReferrals={allReferrals}
          onCreate={addReferral}
          onClose={() => setNewReferralOpen(false)}
        />
      )}

      {closingReferral && (
        <CloseReferralModal
          isOpen={!!closingReferral}
          referral={closingReferral}
          onClose={() => setClosingReferral(null)}
        />
      )}

      {priorAuthFormOpen && priorAuthService && (
        <PriorAuthorizationRequestModal
          isOpen={priorAuthFormOpen}
          member={member}
          service={priorAuthService}
          onClose={() => {
            setPriorAuthFormOpen(false);
            setPriorAuthService(null);
          }}
          onSubmitted={({ subject, body }) => {
            setMessagePrefill({
              recipient: "health_plan",
              channel: "email",
              subject,
              body,
            });
            setSendMessageOpen(true);
          }}
        />
      )}
    </div>
  );
};

export default MemberDetails;
