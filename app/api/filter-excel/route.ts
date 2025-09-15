import { NextResponse } from "next/server"
import { DatabaseConnection } from "@/lib/database"

export async function POST(request: Request) {
  const db = new DatabaseConnection()

  try {
    const { fileId, selectedColumns } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: "Se requiere el ID del archivo" }, { status: 400 })
    }

    if (!selectedColumns || !Array.isArray(selectedColumns) || selectedColumns.length === 0) {
      return NextResponse.json({ error: "Se requiere seleccionar al menos una columna" }, { status: 400 })
    }

    await db.connect()
    const file = await db.getFileById(fileId)

    if (!file) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
    }

    const lines = file.content.split("\n").filter((line) => line.trim())
    if (lines.length === 0) {
      return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 })
    }

    const headers = lines[0].split(",").map((h) => h.trim())
    const columnIndices = selectedColumns.map((col) => headers.indexOf(col)).filter((index) => index !== -1)

    if (columnIndices.length === 0) {
      return NextResponse.json({ error: "No se encontraron las columnas seleccionadas" }, { status: 400 })
    }

    const filteredHeaders = columnIndices.map((index) => headers[index])
    const filteredData = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim())
      return columnIndices.map((index) => values[index] || "")
    })

    const csvContent = [filteredHeaders.join(","), ...filteredData.map((row) => row.join(","))].join("\n")

    return NextResponse.json({
      fileName: `${file.name.replace(".csv", "")}_filtrado.csv`,
      content: csvContent,
      size: csvContent.length,
      headers: filteredHeaders,
      rowCount: filteredData.length,
    })
  } catch (error) {
    console.error("Error filtrando archivo:", error)
    return NextResponse.json({ error: "Error procesando el filtro del archivo" }, { status: 500 })
  } finally {
    await db.disconnect()
  }
}
