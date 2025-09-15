import { NextResponse } from "next/server"
import { DatabaseConnection } from "@/lib/database"

export async function GET() {
  const db = new DatabaseConnection()

  try {
    await db.connect()
    const files = await db.getAllFiles()
    return NextResponse.json(files)
  } catch (error) {
    console.error("Error de conexión a la base de datos:", error)
    return NextResponse.json({ error: "Error conectando con la base de datos PostgreSQL" }, { status: 500 })
  } finally {
    await db.disconnect()
  }
}
