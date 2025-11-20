"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RefreshCw, Download, Mail, UserPlus } from "lucide-react";
import { debounce } from "lodash";
import { ImportAgentsModal } from "@/components/admin/import-agents-modal";
import { AgentCreateModal } from "@/components/admin/agent-create-modal";
import {
  BulkSendInvitesDialog,
  BulkDeactivateDialog,
} from "@/components/admin/bulk-action-dialogs";

interface AgentsFilterBarProps {
  searchParams: {
    page?: string;
    limit?: string;
    region?: string;
    role?: string;
    isActive?: string;
    search?: string;
  };
  onRefresh: () => void;
  selectedCount: number;
  onExportCSV?: () => void;
}

const REGIONS = ["All", "Limassol", "Paphos", "Larnaca", "Famagusta", "Nicosia"];
const ROLES = ["All", "Normal Agent", "Manager Limassol", "Manager Paphos", "Manager Larnaca", "Manager Famagusta", "Manager Nicosia", "CEO", "Listing Admin"];
const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

export function AgentsFilterBar({
  searchParams,
  onRefresh,
  selectedCount,
  onExportCSV,
}: AgentsFilterBarProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(searchParams.search || "");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [sendInvitesDialogOpen, setSendInvitesDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      const params = new URLSearchParams(window.location.search);
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      params.set("page", "1"); // Reset to first page on search
      router.push(`?${params.toString()}`);
    }, 300),
    [router]
  );

  useEffect(() => {
    debouncedSearch(searchValue);
  }, [searchValue, debouncedSearch]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value === "all" || value === "All") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("page", "1"); // Reset to first page on filter change
    router.push(`?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearchValue("");
    router.push("/admin/agents-registry");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={searchParams.region || "All"}
          onValueChange={(value) => handleFilterChange("region", value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.role || "All"}
          onValueChange={(value) => handleFilterChange("role", value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.isActive || "all"}
          onValueChange={(value) => handleFilterChange("isActive", value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleClearFilters}>
          Clear Filters
        </Button>

        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
          <div className="text-sm font-medium">
            {selectedCount} agent{selectedCount > 1 ? "s" : ""} selected
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSendInvitesDialogOpen(true)}
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Invites
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCSV}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600"
              onClick={() => setDeactivateDialogOpen(true)}
            >
              Deactivate
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button onClick={() => setCreateModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New Agent
        </Button>
        <Button variant="outline" onClick={() => setImportModalOpen(true)}>
          <Download className="mr-2 h-4 w-4" />
          Import from Excel
        </Button>
      </div>

      {/* Import Modal */}
      <ImportAgentsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={onRefresh}
      />

      {/* Create Modal */}
      <AgentCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={onRefresh}
      />

      {/* Bulk Action Dialogs */}
      <BulkSendInvitesDialog
        open={sendInvitesDialogOpen}
        onOpenChange={setSendInvitesDialogOpen}
        selectedCount={selectedCount}
        onSuccess={onRefresh}
      />

      <BulkDeactivateDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        selectedCount={selectedCount}
        onSuccess={onRefresh}
      />
    </div>
  );
}
