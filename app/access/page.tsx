"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ACCESS_CODE = "the8thchakra";
const ACCESS_COOKIE_NAME = "qualia-access";
const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

export default function AccessPage() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (code === ACCESS_CODE) {
      const expires = Date.now() + ACCESS_COOKIE_MAX_AGE_SECONDS * 1000;
      const browserWindow = window as typeof window & {
        cookieStore?: {
          set?: (options: {
            name: string;
            value: string;
            expires?: number | Date;
            path?: string;
            sameSite?: "strict" | "lax" | "none";
          }) => Promise<void>;
        };
      };

      if (browserWindow.cookieStore?.set) {
        await browserWindow.cookieStore.set({
          name: ACCESS_COOKIE_NAME,
          value: "granted",
          expires,
          path: "/",
          sameSite: "lax",
        });
      } else {
        /* biome-ignore lint/suspicious/noDocumentCookie: CookieStore API fallback */
        document.cookie = `${ACCESS_COOKIE_NAME}=granted; path=/; max-age=${ACCESS_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
      }

      toast.success("Access granted! Welcome to Qualia AI Agents Suite™");
      router.push("/");
    } else {
      toast.error("Invalid access code. Please try again.");
      setCode("");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const browserWindow = window as typeof window & {
      cookieStore?: {
        get?: (
          name: string
        ) => Promise<{ name: string; value: string } | undefined>;
      };
    };

    const checkAccess = async () => {
      const cookieFromStore = browserWindow.cookieStore?.get
        ? await browserWindow.cookieStore.get(ACCESS_COOKIE_NAME)
        : undefined;

      const hasAccessFromStore = cookieFromStore?.value === "granted";
      const hasAccessFromDocument = document.cookie
        .split("; ")
        .some((row) => row.startsWith(`${ACCESS_COOKIE_NAME}=granted`));

      if (hasAccessFromStore || hasAccessFromDocument) {
        router.push("/");
      }
    };

    checkAccess().catch(() => {
      /* ignore access cookie read errors */
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md">
        <Card className="border-0 bg-slate-800/90 shadow-2xl backdrop-blur-md">
          <CardHeader className="space-y-6 text-center">
            <div className="flex justify-center">
              <Image
                alt="Qualia AI"
                className="rounded-lg"
                height={80}
                src="https://images.squarespace-cdn.com/content/v1/65bf52f873aac538961445c5/19d16cc5-aa83-437c-9c2a-61de5268d5bf/Untitled+design+-+2025-01-19T070746.544.png?format=1500w"
                width={80}
              />
            </div>

            <div className="space-y-2">
              <CardTitle className="font-bold text-2xl text-white">
                Qualia AI Agents Suite™
              </CardTitle>
              <p className="text-slate-400 text-sm">
                Enter your access code to continue
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label
                  className="font-medium text-slate-300 text-sm"
                  htmlFor="code"
                >
                  Access Code
                </Label>
                <Input
                  className="border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                  id="code"
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter your access code"
                  required
                  type="password"
                  value={code}
                />
              </div>

              <Button
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-blue-500/25"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? "Verifying..." : "Access Suite"}
              </Button>
            </form>

            <div className="mt-8 border-slate-700 border-t pt-6">
              <p className="text-center text-slate-500 text-xs">
                Powered by Qualia Solutions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
