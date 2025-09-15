import { type NextRequest, NextResponse } from "next/server"
import { DatabaseConnection } from "@/lib/database"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json(
      {
        success: false,
        error: "Parámetro de búsqueda requerido",
      },
      { status: 400 },
    )
  }

  const db = new DatabaseConnection()

  try {
    await db.connect()
    const files = await db.searchFilesByName(query)

    return NextResponse.json({
      success: true,
      data: files,
    })
  } catch (error) {
    console.error("[v0] Error searching files:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al buscar archivos",
      },
      { status: 500 },
    )
  } finally {
    await db.disconnect()
  }
}
