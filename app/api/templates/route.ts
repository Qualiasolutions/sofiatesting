import { NextResponse } from "next/server";
import { getTemplateData } from "@/lib/template-data-server";

export async function GET() {
  try {
    const templateData = getTemplateData();
    return NextResponse.json(templateData);
  } catch (error) {
    console.error("Failed to load template data:", error);
    return NextResponse.json(
      { error: "Failed to load template data" },
      { status: 500 }
    );
  }
}
