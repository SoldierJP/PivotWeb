import { NextResponse } from "next/server"
import { DatabaseConnection } from "@/lib/database"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const db = new DatabaseConnection()

  try {
    await db.connect()
    const file = await db.getFileById(params.id)

    if (!file) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(file)
  } catch (error) {
    console.error("Error obteniendo archivo:", error)
    return NextResponse.json({ error: "Error obteniendo archivo de la base de datos" }, { status: 500 })
  } finally {
    await db.disconnect()
  }
}
