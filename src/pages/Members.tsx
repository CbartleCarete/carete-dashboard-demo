import { useEffect, useRef, useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus, Filter, IdCard } from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import AddMemberModal from "../components/ui/AddMemberModal";
import { type Member } from "../utils/membersUtils";
import { useMembers, addMember } from "../data/membersStore";

type FilterType = "dob" | "mcp" | "status" | null;

const fieldControl =
  "h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition";

const Members: FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const members = useMembers();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>(null);
  const [filterValue, setFilterValue] = useState("");
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilter(false);
      }
    };
    if (showFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilter]);

  const handleAddMember = (newMember: Member) => {
    addMember(newMember);
  };

  const uniqueMcps = Array.from(new Set(members.map((m) => m.mcp)));

  const filteredMembers = members.filter((member) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      member.name.toLowerCase().includes(searchLower) ||
      member.id.toLowerCase().includes(searchLower) ||
      member.dob.toLowerCase().includes(searchLower) ||
      member.mcp.toLowerCase().includes(searchLower);

    let matchesFilter = true;
    if (filterType && filterValue) {
      switch (filterType) {
        case "dob":
          matchesFilter = member.dob
            .toLowerCase()
            .includes(filterValue.toLowerCase());
          break;
        case "mcp":
          matchesFilter = member.mcp === filterValue;
          break;
        case "status":
          matchesFilter = member.status === filterValue.toLowerCase();
          break;
      }
    }
    return matchesSearch && matchesFilter;
  });

  const displayMembers = [...filteredMembers].reverse();

  const handleFilterSelect = (type: Exclude<FilterType, null>) => {
    setFilterType(type);
    setFilterValue("");
    setShowFilter(false);
  };

  const clearFilter = () => {
    setFilterType(null);
    setFilterValue("");
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">Members</h1>
            <p className="text-sm text-ink-500 mt-1">
              Manage member profiles and eligibility
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition"
          >
            <UserPlus size={18} />
            Add Member
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-ink-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-semibold text-ink-900">
                Eligibility Queue
              </h2>
              <p className="text-sm text-ink-500">
                Members awaiting eligibility confirmation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative w-full sm:w-80">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="text"
                  placeholder="Search by name, ID, or date birth..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-ink-200 bg-white text-sm placeholder:text-ink-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                />
              </div>

              <div className="relative" ref={filterDropdownRef}>
                <button
                  onClick={() => setShowFilter((prev) => !prev)}
                  className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-700 hover:bg-surface-muted transition"
                >
                  <Filter size={16} />
                  Filter by
                </button>

                {showFilter && (
                  <div className="absolute right-0 top-full mt-2 w-36 rounded-lg bg-white border border-ink-200 shadow-lg py-1 z-10">
                    {(["dob", "mcp", "status"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => handleFilterSelect(t)}
                        className="block w-full text-left px-3 py-2 text-sm text-ink-700 hover:bg-surface-muted"
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}

                {filterType && (
                  <div className="absolute right-0 top-full mt-2 flex items-center gap-2 rounded-lg bg-white border border-ink-200 shadow-lg p-2 z-10">
                    {filterType === "dob" && (
                      <input
                        type="text"
                        placeholder="MM-DD-YYYY"
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className={fieldControl}
                      />
                    )}
                    {filterType === "mcp" && (
                      <select
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className={fieldControl}
                      >
                        <option value="">Select MCP</option>
                        {uniqueMcps.map((mcp) => (
                          <option key={mcp} value={mcp}>
                            {mcp}
                          </option>
                        ))}
                      </select>
                    )}
                    {filterType === "status" && (
                      <select
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className={fieldControl}
                      >
                        <option value="">Select Status</option>
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="ineligible">Ineligible</option>
                      </select>
                    )}
                    <button
                      onClick={clearFilter}
                      className="h-10 px-3 rounded-lg text-sm font-medium text-ink-500 hover:bg-surface-muted"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <ul className="divide-y divide-ink-200">
            {displayMembers.map((member) => (
              <li
                key={member.id}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto] items-center gap-4 py-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-10 w-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <IdCard size={20} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink-900 truncate">
                      {member.name}
                    </div>
                    <div className="text-xs text-ink-400 truncate">
                      {member.id}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-ink-400">DOB</div>
                  <div className="text-sm text-ink-700">{member.dob}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-400">MCP</div>
                  <div className="text-sm text-ink-700">{member.mcp}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-400">Last Service</div>
                  <div className="text-sm text-ink-700">
                    {member.lastService}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-ink-400">Status</div>
                  <StatusBadge
                    status={
                      member.status as "pending" | "active" | "ineligible"
                    }
                  />
                </div>

                <button
                  onClick={() => navigate(`/members/${member.id}`)}
                  className="h-10 px-4 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition"
                >
                  View Details
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <AddMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddMember={handleAddMember}
      />
    </>
  );
};

export default Members;
