"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Download,
} from "lucide-react";
import Papa from "papaparse";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";

interface ImportAgentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedAgent {
  fullName: string;
  email: string;
  phoneNumber?: string;
  region: string;
  role: string;
  errors: string[];
}

interface ColumnMapping {
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  region: string | null;
  role: string | null;
}

const REQUIRED_FIELDS = ["fullName", "email", "region", "role"];
const OPTIONAL_FIELDS = ["phoneNumber"];

export function ImportAgentsModal({
  open,
  onOpenChange,
  onSuccess,
}: ImportAgentsModalProps) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    fullName: null,
    email: null,
    phoneNumber: null,
    region: null,
    role: null,
  });
  const [parsedAgents, setParsedAgents] = useState<ParsedAgent[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFile(file);
    setError(null);

    // Parse file
    if (file.name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setHeaders(results.meta.fields || []);
          setRawData(results.data);
          autoMapColumns(results.meta.fields || []);
          setStep(2);
        },
        error: (error) => {
          setError(`Failed to parse CSV: ${error.message}`);
        },
      });
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            setError("File must contain at least a header row and one data row");
            return;
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1).map((row: any) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });

          setHeaders(headers);
          setRawData(rows);
          autoMapColumns(headers);
          setStep(2);
        } catch (error) {
          setError(`Failed to parse Excel file: ${error}`);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setError("Unsupported file type. Please upload CSV or Excel file.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
  });

  const autoMapColumns = (headers: string[]) => {
    const mapping: ColumnMapping = {
      fullName: null,
      email: null,
      phoneNumber: null,
      region: null,
      role: null,
    };

    headers.forEach((header) => {
      const lower = header.toLowerCase();
      if (lower.includes("name") || lower.includes("full")) {
        mapping.fullName = header;
      } else if (lower.includes("email") || lower.includes("e-mail")) {
        mapping.email = header;
      } else if (lower.includes("phone") || lower.includes("mobile") || lower.includes("tel")) {
        mapping.phoneNumber = header;
      } else if (lower.includes("region") || lower.includes("area") || lower.includes("location")) {
        mapping.region = header;
      } else if (lower.includes("role") || lower.includes("position") || lower.includes("title")) {
        mapping.role = header;
      }
    });

    setColumnMapping(mapping);
  };

  const validateAndPreview = () => {
    // Check all required fields are mapped
    const missingFields = REQUIRED_FIELDS.filter((field) => !columnMapping[field as keyof ColumnMapping]);
    if (missingFields.length > 0) {
      setError(`Please map required fields: ${missingFields.join(", ")}`);
      return;
    }

    // Parse and validate data
    const agents: ParsedAgent[] = rawData.map((row, index) => {
      const errors: string[] = [];
      const agent: ParsedAgent = {
        fullName: "",
        email: "",
        phoneNumber: "",
        region: "",
        role: "",
        errors: [],
      };

      // Map fields
      if (columnMapping.fullName) agent.fullName = row[columnMapping.fullName]?.toString().trim() || "";
      if (columnMapping.email) agent.email = row[columnMapping.email]?.toString().trim().toLowerCase() || "";
      if (columnMapping.phoneNumber) agent.phoneNumber = row[columnMapping.phoneNumber]?.toString().trim() || "";
      if (columnMapping.region) agent.region = row[columnMapping.region]?.toString().trim() || "";
      if (columnMapping.role) agent.role = row[columnMapping.role]?.toString().trim() || "";

      // Validate required fields
      if (!agent.fullName) errors.push("Full name is required");
      if (!agent.email) errors.push("Email is required");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agent.email)) {
        errors.push("Invalid email format");
      }
      if (!agent.region) errors.push("Region is required");
      if (!agent.role) errors.push("Role is required");

      agent.errors = errors;
      return agent;
    });

    setParsedAgents(agents);
    setError(null);
    setStep(3);
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);

    try {
      // Filter out agents with errors
      const validAgents = parsedAgents.filter((agent) => agent.errors.length === 0);

      if (validAgents.length === 0) {
        setError("No valid agents to import. Please fix validation errors.");
        setImporting(false);
        return;
      }

      // Call import API
      const response = await fetch("/api/admin/agents/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agents: validAgents }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Import failed");
      }

      const result = await response.json();

      // Success
      onSuccess();
      onOpenChange(false);
      resetModal();
    } catch (error: any) {
      setError(error.message || "Failed to import agents");
    } finally {
      setImporting(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setFile(null);
    setHeaders([]);
    setRawData([]);
    setColumnMapping({
      fullName: null,
      email: null,
      phoneNumber: null,
      region: null,
      role: null,
    });
    setParsedAgents([]);
    setError(null);
  };

  const handleClose = () => {
    if (!importing) {
      resetModal();
      onOpenChange(false);
    }
  };

  const validAgentsCount = parsedAgents.filter((a) => a.errors.length === 0).length;
  const invalidAgentsCount = parsedAgents.length - validAgentsCount;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Agents from File</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with agent information
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={step >= 1 ? "font-medium" : "text-muted-foreground"}>1. Upload</span>
            <span className={step >= 2 ? "font-medium" : "text-muted-foreground"}>2. Map Columns</span>
            <span className={step >= 3 ? "font-medium" : "text-muted-foreground"}>3. Preview & Import</span>
          </div>
          <Progress value={(step / 3) * 100} />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: File Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/10"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              {isDragActive ? (
                <p className="text-lg">Drop the file here...</p>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">
                    Drag & drop your file here
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse
                  </p>
                  <Badge variant="secondary">CSV, XLS, XLSX</Badge>
                </>
              )}
            </div>

            {file && (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Remove
                </Button>
              </div>
            )}

            <Alert>
              <Download className="h-4 w-4" />
              <AlertDescription>
                <strong>Required columns:</strong> Full Name, Email, Region, Role
                <br />
                <strong>Optional columns:</strong> Phone Number
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Map the columns from your file to agent fields
            </p>

            <div className="grid gap-4">
              {/* Full Name */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label className="font-medium">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={columnMapping.fullName || ""}
                  onValueChange={(value) =>
                    setColumnMapping({ ...columnMapping, fullName: value })
                  }
                >
                  <SelectTrigger className="col-span-2">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Email */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label className="font-medium">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={columnMapping.email || ""}
                  onValueChange={(value) =>
                    setColumnMapping({ ...columnMapping, email: value })
                  }
                >
                  <SelectTrigger className="col-span-2">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Phone Number */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label className="font-medium">Phone Number</Label>
                <Select
                  value={columnMapping.phoneNumber || ""}
                  onValueChange={(value) =>
                    setColumnMapping({ ...columnMapping, phoneNumber: value })
                  }
                >
                  <SelectTrigger className="col-span-2">
                    <SelectValue placeholder="Select column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Region */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label className="font-medium">
                  Region <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={columnMapping.region || ""}
                  onValueChange={(value) =>
                    setColumnMapping({ ...columnMapping, region: value })
                  }
                >
                  <SelectTrigger className="col-span-2">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label className="font-medium">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={columnMapping.role || ""}
                  onValueChange={(value) =>
                    setColumnMapping({ ...columnMapping, role: value })
                  }
                >
                  <SelectTrigger className="col-span-2">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Found {rawData.length} rows in the file
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Step 3: Preview & Validation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Ready to import {validAgentsCount} agents
                </p>
                {invalidAgentsCount > 0 && (
                  <p className="text-sm text-destructive">
                    {invalidAgentsCount} agents have validation errors
                  </p>
                )}
              </div>
            </div>

            <div className="border rounded-lg max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Region</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedAgents.map((agent, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{agent.fullName}</td>
                      <td className="p-2">{agent.email}</td>
                      <td className="p-2">{agent.region}</td>
                      <td className="p-2">
                        {agent.errors.length === 0 ? (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {agent.errors.length} errors
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={importing}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}

          {step === 1 && (
            <Button onClick={handleClose} variant="outline">
              Cancel
            </Button>
          )}

          {step === 2 && (
            <Button onClick={validateAndPreview}>
              Next: Preview
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {step === 3 && (
            <Button
              onClick={handleImport}
              disabled={importing || validAgentsCount === 0}
            >
              {importing ? "Importing..." : `Import ${validAgentsCount} Agents`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
