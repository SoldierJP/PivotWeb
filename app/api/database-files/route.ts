import { NextResponse } from "next/server"
import { Client } from "pg"

export async function GET() {
  const client = new Client({
    host: "localhost",
    port: 5433,
    database: "chip",
    user: "app",
    password: "app",
  })

  try {
    await client.connect()

    // Query to get Excel files from database
    // Assuming you have a table called 'excel_files' with columns: id, name, content, size
    const result = await client.query(`
      SELECT id, name, content, 
             CASE 
               WHEN content IS NOT NULL THEN length(content) 
               ELSE 0 
             END as size
      FROM excel_files 
      ORDER BY name
    `)

    const files = result.rows.map((row) => ({
      id: row.id.toString(),
      name: row.name,
      size: Number.parseInt(row.size) || 0,
      content: row.content || "",
    }))

    return NextResponse.json(files)
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json({ error: "Error conectando con la base de datos PostgreSQL" }, { status: 500 })
  } finally {
    await client.end()
  }
}
