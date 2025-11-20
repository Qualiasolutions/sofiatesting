"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AgentForm } from "@/components/admin/agent-form";
import type { AgentFormData } from "@/lib/validations/agent";
import { toast } from "sonner";

interface AgentEditModalProps {
  agent: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    region: string;
    role: string;
    isActive: boolean;
    notes: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AgentEditModal({
  agent,
  open,
  onOpenChange,
  onSuccess,
}: AgentEditModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: AgentFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/agents/${agent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update agent");
      }

      toast.success("Agent updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update agent");
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
          <DialogDescription>
            Update agent information for {agent.fullName}
          </DialogDescription>
        </DialogHeader>

        <AgentForm
          initialData={{
            fullName: agent.fullName,
            email: agent.email,
            phoneNumber: agent.phoneNumber || "",
            region: agent.region as any,
            role: agent.role as any,
            isActive: agent.isActive,
            notes: agent.notes || "",
          }}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel="Update Agent"
        />
      </DialogContent>
    </Dialog>
  );
}
