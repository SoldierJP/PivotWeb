import { NextResponse } from "next/server"
import { DatabaseConnection } from "@/lib/database"

export async function GET() {
  const db = new DatabaseConnection()

  try {
    await db.connect()
    const stats = await db.getFileStats()

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("[v0] Error fetching file stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener estadísticas de archivos",
      },
      { status: 500 },
    )
  } finally {
    await db.disconnect()
  }
}
