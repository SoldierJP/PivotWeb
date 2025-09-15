import { NextResponse } from "next/server"
import { DatabaseConnection } from "@/lib/database"

export async function POST(request: Request) {
  const db = new DatabaseConnection()

  try {
    const { fileIds, joinMethod } = await request.json()

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: "Se requiere una lista de IDs de archivos" }, { status: 400 })
    }

    await db.connect()
    const files = await db.getFilesByIds(fileIds)

    if (files.length === 0) {
      return NextResponse.json({ error: "No se encontraron archivos con los IDs proporcionados" }, { status: 404 })
    }

    let joinedContent = ""
    const joinedFileName = `archivos_unidos_${Date.now()}.csv`

    switch (joinMethod) {
      case "concatenate":
        joinedContent = files.map((file) => file.content).join("\n\n")
        break

      case "merge-lines":
        const allLines = files.map((file) => file.content.split("\n"))
        const maxLines = Math.max(...allLines.map((lines) => lines.length))

        for (let i = 0; i < maxLines; i++) {
          const lineData = allLines.map((lines) => lines[i] || "").join(",")
          joinedContent += lineData + "\n"
        }
        break

      default:
        joinedContent = files.map((file) => file.content).join("\n\n")
    }

    return NextResponse.json({
      fileName: joinedFileName,
      content: joinedContent,
      size: joinedContent.length,
      originalFiles: files.map((f) => f.name),
    })
  } catch (error) {
    console.error("Error uniendo archivos:", error)
    return NextResponse.json({ error: "Error procesando la unión de archivos" }, { status: 500 })
  } finally {
    await db.disconnect()
  }
}
