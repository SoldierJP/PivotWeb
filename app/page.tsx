import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileJoiner } from "@/components/file-joiner"
import { ExcelFilter } from "@/components/excel-filter"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Panel de Gestión de Archivos</h1>
          <p className="text-muted-foreground mt-2">Une múltiples archivos o filtra datos de Excel con facilidad</p>
        </div>

        <Tabs defaultValue="joiner" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="joiner">Unir Archivos</TabsTrigger>
            <TabsTrigger value="filter">Filtro Excel</TabsTrigger>
          </TabsList>

          <TabsContent value="joiner" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Unir Archivos</CardTitle>
                <CardDescription>
                  Conecta con tu base de datos PostgreSQL para unir archivos Excel almacenados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileJoiner />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filter" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Filtro de Excel</CardTitle>
                <CardDescription>
                  Sube un archivo Excel y filtra columnas específicas para ver o descargar los resultados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExcelFilter />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
