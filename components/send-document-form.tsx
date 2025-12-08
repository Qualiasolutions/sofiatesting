"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Loader2, Mail, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const sendFormSchema = z
  .object({
    recipientName: z.string().min(1, "Recipient name is required"),
    recipientEmail: z
      .string()
      .email("Invalid email")
      .optional()
      .or(z.literal("")),
    recipientPhone: z.string().optional().or(z.literal("")),
    message: z.string().optional(),
    method: z.enum(["email", "whatsapp", "download"]),
  })
  .refine(
    (data) => {
      if (data.method === "email") {
        return !!data.recipientEmail && data.recipientEmail.length > 0;
      }
      if (data.method === "whatsapp") {
        return !!data.recipientPhone && data.recipientPhone.length > 0;
      }
      return true;
    },
    {
      message: "Email is required for email delivery, phone for WhatsApp",
      path: ["method"],
    }
  );

type SendFormValues = z.infer<typeof sendFormSchema>;

type SendDocumentFormProps = {
  documentTitle: string;
  documentUrl: string;
  documentContent?: string;
  chatId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function SendDocumentForm({
  documentTitle,
  documentUrl,
  documentContent,
  chatId,
  onSuccess,
  onCancel,
}: SendDocumentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"email" | "whatsapp" | "download">(
    "email"
  );

  const form = useForm<SendFormValues>({
    resolver: zodResolver(sendFormSchema),
    defaultValues: {
      recipientName: "",
      recipientEmail: "",
      recipientPhone: "",
      message: "",
      method: "email",
    },
  });

  const handleTabChange = (value: string) => {
    const newMethod = value as "email" | "whatsapp" | "download";
    setActiveTab(newMethod);
    form.setValue("method", newMethod);
  };

  const handleDownload = async () => {
    try {
      setIsSubmitting(true);
      // Trigger download
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = documentTitle.endsWith(".docx")
        ? documentTitle
        : `${documentTitle}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Document downloaded successfully");
      onSuccess?.();
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (values: SendFormValues) => {
    if (values.method === "download") {
      await handleDownload();
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/documents/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentUrl,
          documentTitle,
          documentContent,
          chatId,
          ...values,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send document");
      }

      toast.success(data.message || "Document sent successfully");
      onSuccess?.();
    } catch (error) {
      console.error("Send error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send document"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Preview */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{documentTitle}</p>
            <p className="text-muted-foreground text-sm">
              Word Document (.docx)
            </p>
          </div>
        </div>
      </div>

      <Tabs
        className="w-full"
        defaultValue="email"
        onValueChange={handleTabChange}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger className="gap-2" value="email">
            <Mail className="size-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger className="gap-2" value="whatsapp">
            <MessageCircle className="size-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger className="gap-2" value="download">
            <Download className="size-4" />
            <span className="hidden sm:inline">Download</span>
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form
            className="mt-4 space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <TabsContent className="space-y-4" value="email">
              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="john@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a personal message..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This message will be included in the email body
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent className="space-y-4" value="whatsapp">
              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+357 99 123 456"
                        type="tel"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include country code (e.g., +357 for Cyprus)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caption (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a caption for the document..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent className="space-y-4" value="download">
              <div className="rounded-lg border border-dashed p-6 text-center">
                <Download className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-2 font-medium">Download Document</p>
                <p className="text-muted-foreground text-sm">
                  Save the document to your device
                </p>
              </div>
            </TabsContent>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {onCancel && (
                <Button
                  className="flex-1"
                  disabled={isSubmitting}
                  onClick={onCancel}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              )}
              <Button
                className="flex-1 gap-2"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {activeTab === "download" ? "Downloading..." : "Sending..."}
                  </>
                ) : (
                  <>
                    {activeTab === "download" ? (
                      <Download className="size-4" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    {activeTab === "download" ? "Download" : "Send"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
}
