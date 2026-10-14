export interface Member {
  name: string;
  id: string;
  dob: string;
  mcp: string;
  lastService: string;
  status: "pending" | "active" | "ineligible";
  /** Payer-form fields. Optional so existing members.json stays valid. */
  cin?: string;
  address?: string;
  city?: string;
  zip?: string;
  homeless?: boolean;
  /** Member's own phone number — contact info for PA requests, outreach, etc. */
  phone?: string;
  /** Health plan's own member ID (distinct from the state Medicaid CIN above). */
  healthPlanMemberId?: string;
}

/** Split a "First Last" (or "Last, First") display name into parts. */
export const splitName = (
  name: string
): { first: string; last: string } => {
  const trimmed = name.trim();
  if (trimmed.includes(",")) {
    const [last, first] = trimmed.split(",");
    return { first: first?.trim() ?? "", last: last?.trim() ?? "" };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: "", last: parts[0] };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
};

/**
 * Formats form data into a Member object matching the members.json structure
 */
export const formatMemberData = (formData: {
  name: string;
  id: string;
  dob: string;
  mcp: string;
  lastService?: string;
  status: string;
}): Member => {
  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const formatStatus = (status: string): "pending" | "active" | "ineligible" => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "active") return "active";
    if (lowerStatus === "pending") return "pending";
    if (lowerStatus === "ineligible") return "ineligible";
    return "pending"; // default
  };

  return {
    name: formData.name || "",
    id: formData.id || "",
    dob: formatDate(formData.dob),
    mcp: formData.mcp || "",
    lastService: formData.lastService ? formatDate(formData.lastService) : "N/A",
    status: formatStatus(formData.status)
  };
};

/**
 * Appends a new member to the existing members array and returns the updated array
 */
export const appendMemberToData = (currentMembers: Member[], newMember: Member): Member[] => {
  return [...currentMembers, newMember];
};
