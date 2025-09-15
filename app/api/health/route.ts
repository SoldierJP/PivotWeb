import { NextResponse } from "next/server"
import { DatabaseConnection } from "@/lib/database"

export async function GET() {
  const db = new DatabaseConnection()

  try {
    await db.connect()
    const isHealthy = await db.testConnection()

    return NextResponse.json({
      success: true,
      database: isHealthy ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Health check failed:", error)
    return NextResponse.json(
      {
        success: false,
        database: "error",
        error: "Error de conexión a la base de datos",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  } finally {
    await db.disconnect()
  }
}
