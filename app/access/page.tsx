"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const ACCESS_CODE = "the8thchakra";

export default function AccessPage() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (code === ACCESS_CODE) {
      // Set a cookie to indicate access granted
      document.cookie = "qualia-access=granted; path=/; max-age=86400; SameSite=Lax";
      toast.success("Access granted! Welcome to Qualia AI Agents Suite™");
      router.push("/");
    } else {
      toast.error("Invalid access code. Please try again.");
      setCode("");
    }

    setIsLoading(false);
  };

  // Check if access is already granted via cookie
  if (typeof window !== "undefined") {
    const hasAccess = document.cookie
      .split("; ")
      .some((row) => row.startsWith("qualia-access=granted"));
    if (hasAccess) {
      router.push("/");
      return null;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-slate-800/90 backdrop-blur-md">
          <CardHeader className="text-center space-y-6">
            <div className="flex justify-center">
              <Image
                src="https://images.squarespace-cdn.com/content/v1/65bf52f873aac538961445c5/19d16cc5-aa83-437c-9c2a-61de5268d5bf/Untitled+design+-+2025-01-19T070746.544.png?format=1500w"
                alt="Qualia AI"
                width={80}
                height={80}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-white">
                Qualia AI Agents Suite™
              </CardTitle>
              <p className="text-slate-400 text-sm">
                Enter your access code to continue
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-300 text-sm font-medium">
                  Access Code
                </Label>
                <Input
                  id="code"
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter your access code"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Access Suite"}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-700">
              <p className="text-center text-xs text-slate-500">
                Powered by Qualia Solutions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}