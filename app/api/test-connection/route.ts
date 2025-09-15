import { NextResponse } from "next/server"
import { DatabaseConnection } from "@/lib/database"

export async function GET() {
  try {
    const db = new DatabaseConnection()
    await db.connect()

    // Test basic query
    const result = await db.query("SELECT NOW() as current_time, version() as pg_version")
    await db.disconnect()

    return NextResponse.json({
      success: true,
      message: "Conexión a la base de datos exitosa",
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Error de conexión a la base de datos:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al conectar con la base de datos",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
