export interface DownloadOptions {
  filename: string
  type?: string
}

export function downloadBlob(blob: Blob, options: DownloadOptions) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = options.filename
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadText(content: string, options: DownloadOptions) {
  const blob = new Blob([content], { type: options.type || "text/plain" })
  downloadBlob(blob, options)
}

export function downloadCSV(data: string[][], filename: string) {
  const csvContent = data
    .map((row) => row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(","))
    .join("\n")

  downloadText(csvContent, { filename, type: "text/csv" })
}

export function downloadJSON(data: any, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  downloadText(jsonContent, { filename, type: "application/json" })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9.-]/gi, "_").toLowerCase()
}
