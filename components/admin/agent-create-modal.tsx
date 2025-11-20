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

interface AgentCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AgentCreateModal({
  open,
  onOpenChange,
  onSuccess,
}: AgentCreateModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: AgentFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create agent");
      }

      toast.success("Agent created successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create agent");
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Agent</DialogTitle>
          <DialogDescription>
            Create a new agent account for Zyprus Property Group
          </DialogDescription>
        </DialogHeader>

        <AgentForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel="Create Agent"
        />
      </DialogContent>
    </Dialog>
  );
}
