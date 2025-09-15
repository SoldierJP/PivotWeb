import { NextResponse } from "next/server"
import { DatabaseConnection } from "@/lib/database"

export async function GET() {
  try {
    console.log("[v0] Testing database connection...")
    console.log("[v0] Environment variables:", {
      PGHOST: process.env.PGHOST,
      PGPORT: process.env.PGPORT,
      PGDATABASE: process.env.PGDATABASE,
      PGUSER: process.env.PGUSER,
      PGPASSWORD: process.env.PGPASSWORD ? "***" : "undefined",
    })

    const db = new DatabaseConnection()

    await db.connect()
    console.log("[v0] Database connected successfully")

    const isConnected = await db.testConnection()

    if (!isConnected) {
      await db.disconnect()
      throw new Error("Test query failed")
    }

    await db.disconnect()
    console.log("[v0] Database test completed successfully")

    return NextResponse.json({
      success: true,
      message: "Conexión a la base de datos exitosa",
      data: {
        host: process.env.PGHOST || "localhost",
        port: process.env.PGPORT || "5433",
        database: process.env.PGDATABASE || "chip",
      },
    })
  } catch (error) {
    console.error("[v0] Error de conexión a la base de datos:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al conectar con la base de datos",
        error: error instanceof Error ? error.message : "Error desconocido",
        details: {
          host: process.env.PGHOST || "localhost",
          port: process.env.PGPORT || "5433",
          database: process.env.PGDATABASE || "chip",
        },
      },
      { status: 500 },
    )
  }
}
