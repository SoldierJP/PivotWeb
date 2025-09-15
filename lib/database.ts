import { Client } from "pg"

export interface DatabaseFile {
  id: string
  name: string
  content: string
  size: number
  created_at: string
  updated_at: string
}

export class DatabaseConnection {
  private client: Client

  constructor() {
    const config = {
      host: process.env.PGHOST || "localhost",
      port: Number.parseInt(process.env.PGPORT || "5433"),
      database: process.env.PGDATABASE || "chip",
      user: process.env.PGUSER || "app",
      password: process.env.PGPASSWORD || "app",
      connectionTimeoutMillis: 10000,
      query_timeout: 5000,
      ssl: false,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    }

    console.log("[v0] Creating database connection with config:", {
      ...config,
      password: config.password ? "***" : "undefined",
    })

    this.client = new Client(config)
  }

  async connect() {
    try {
      console.log("[v0] Attempting to connect to database...")
      await this.client.connect()
      console.log("[v0] Database connection established")
    } catch (error) {
      console.error("[v0] Failed to connect to database:", error)
      if (error instanceof Error) {
        if (error.message.includes("ECONNREFUSED")) {
          throw new Error(
            `No se puede conectar a la base de datos. Verifica que el contenedor Docker esté ejecutándose en ${process.env.PGHOST || "localhost"}:${process.env.PGPORT || "5433"}`,
          )
        }
        if (error.message.includes("ENOTFOUND")) {
          throw new Error(`Host de base de datos no encontrado: ${process.env.PGHOST || "localhost"}`)
        }
      }
      throw error
    }
  }

  async disconnect() {
    await this.client.end()
  }

  async getAllFiles(): Promise<DatabaseFile[]> {
    const result = await this.client.query(`
      SELECT 
        id, 
        name, 
        content,
        CASE 
          WHEN content IS NOT NULL THEN length(content) 
          ELSE 0 
        END as size,
        created_at,
        updated_at
      FROM excel_files 
      ORDER BY name
    `)

    return result.rows.map((row) => ({
      id: row.id.toString(),
      name: row.name,
      content: row.content || "",
      size: Number.parseInt(row.size) || 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))
  }

  async getFileById(id: string): Promise<DatabaseFile | null> {
    const result = await this.client.query(
      `SELECT 
        id, 
        name, 
        content,
        CASE 
          WHEN content IS NOT NULL THEN length(content) 
          ELSE 0 
        END as size,
        created_at,
        updated_at
      FROM excel_files 
      WHERE id = $1`,
      [id],
    )

    if (result.rows.length === 0) return null

    const row = result.rows[0]
    return {
      id: row.id.toString(),
      name: row.name,
      content: row.content || "",
      size: Number.parseInt(row.size) || 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
  }

  async getFilesByIds(ids: string[]): Promise<DatabaseFile[]> {
    if (ids.length === 0) return []

    const placeholders = ids.map((_, index) => `$${index + 1}`).join(",")
    const result = await this.client.query(
      `SELECT 
        id, 
        name, 
        content,
        CASE 
          WHEN content IS NOT NULL THEN length(content) 
          ELSE 0 
        END as size,
        created_at,
        updated_at
      FROM excel_files 
      WHERE id IN (${placeholders})
      ORDER BY name`,
      ids,
    )

    return result.rows.map((row) => ({
      id: row.id.toString(),
      name: row.name,
      content: row.content || "",
      size: Number.parseInt(row.size) || 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.query("SELECT 1")
      return true
    } catch (error) {
      console.error("[v0] Database connection test failed:", error)
      return false
    }
  }

  async getFileStats(): Promise<{ total: number; totalSize: number }> {
    const result = await this.client.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN content IS NOT NULL THEN length(content) ELSE 0 END), 0) as total_size
      FROM excel_files
    `)

    return {
      total: Number.parseInt(result.rows[0].total) || 0,
      totalSize: Number.parseInt(result.rows[0].total_size) || 0,
    }
  }

  async searchFilesByName(searchTerm: string): Promise<DatabaseFile[]> {
    const result = await this.client.query(
      `
      SELECT 
        id, 
        name, 
        content,
        CASE 
          WHEN content IS NOT NULL THEN length(content) 
          ELSE 0 
        END as size,
        created_at,
        updated_at
      FROM excel_files 
      WHERE name ILIKE $1
      ORDER BY name
    `,
      [`%${searchTerm}%`],
    )

    return result.rows.map((row) => ({
      id: row.id.toString(),
      name: row.name,
      content: row.content || "",
      size: Number.parseInt(row.size) || 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))
  }

  async saveFile(name: string, content: string): Promise<string> {
    const result = await this.client.query(
      `INSERT INTO excel_files (name, content, created_at, updated_at) 
       VALUES ($1, $2, NOW(), NOW()) 
       RETURNING id`,
      [name, content],
    )

    return result.rows[0].id.toString()
  }
}
