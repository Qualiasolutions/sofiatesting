import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";

export async function GET() {
  try {
    // Test database connection
    const result = await db.execute(sql`SELECT 1 as test, NOW() as timestamp`);

    return Response.json({
      status: "connected",
      database: "postgres",
      result: result[0],
      message: "Database connection successful!",
    });
  } catch (error) {
    console.error("Database connection test failed:", error);

    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
