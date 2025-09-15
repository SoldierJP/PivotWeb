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

export async function POST(request: Request) {
  const db = new DatabaseConnection()

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Tipo de archivo no válido. Solo se permiten archivos CSV y Excel" },
        { status: 400 },
      )
    }

    const content = await file.text()

    await db.connect()
    const fileId = await db.saveFile(file.name, content)

    return NextResponse.json({
      success: true,
      message: "Archivo subido exitosamente",
      fileId,
      fileName: file.name,
      size: content.length,
    })
  } catch (error) {
    console.error("Error subiendo archivo:", error)
    return NextResponse.json({ error: "Error procesando la subida del archivo" }, { status: 500 })
  } finally {
    await db.disconnect()
  }
}
