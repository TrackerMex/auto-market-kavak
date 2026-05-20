import { Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  ProjectProgressDatum,
  StatusChartDatum,
  TimelineDatum,
} from "@/lib/dashboard-analytics";
import type { ReactNode } from "react";

interface VerticalBarChartsProps {
  statusData: StatusChartDatum[];
  projectData: ProjectProgressDatum[];
  timelineData: TimelineDatum[];
}

const statusConfig = {
  PROGRAMADO: {
    label: "Programado",
    color: "#3b82f6",
  },
  ATRASADO: {
    label: "Atrasado",
    color: "#f43f5e",
  },
  EN_PROCESO: {
    label: "En Proceso",
    color: "#6366f1",
  },
  EN_PROCESO_DESFASADO: {
    label: "En Proceso (Desfasado)",
    color: "#f59e0b",
  },
  FINALIZADO_A_TIEMPO: {
    label: "Finalizado",
    color: "#10b981",
  },
  FINALIZADO_DESFASADO: {
    label: "Finalizado (Desfasado)",
    color: "#eab308",
  },
} satisfies ChartConfig;

const projectConfig = {
  total: {
    label: "Total",
    color: "#6366f1",
  },
} satisfies ChartConfig;

const timelineConfig = {
  finished: {
    label: "Finalizado",
    color: "#10b981",
  },
  pending: {
    label: "Pendiente",
    color: "#f59e0b",
  },
} satisfies ChartConfig;

function EmptyState({ label }: { label: ReactNode }) {
  return (
    <div className="text-muted-foreground flex h-[280px] items-center justify-center text-sm">
      {label}
    </div>
  );
}

export function VerticalBarCharts({
  statusData,
  projectData,
  timelineData,
}: VerticalBarChartsProps) {
  return (
    <Card id="graficas" className="@container/card">
      <CardHeader>
        <CardTitle>Estadisticas</CardTitle>
        <CardDescription>
          Distribucion de instalaciones por estatus, proyectos y tendencia.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList>
            <TabsTrigger value="status">Estatus</TabsTrigger>
            <TabsTrigger value="projects">Proyectos</TabsTrigger>
            <TabsTrigger value="timeline">Tendencia</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="pt-4">
            {statusData.some((item) => item.count > 0) ? (
              <ChartContainer config={statusConfig} className="h-[320px] w-full">
                <RechartsBarChart
                  data={statusData}
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="count"
                    radius={8}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {statusData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={`var(--color-${entry.key})`}
                      />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ChartContainer>
            ) : (
              <EmptyState label="No hay datos para mostrar." />
            )}
          </TabsContent>

          <TabsContent value="projects" className="pt-4">
            {projectData.length > 0 ? (
              <ChartContainer config={projectConfig} className="h-[320px] w-full">
                <RechartsBarChart
                  data={projectData}
                  margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="project"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="total"
                    radius={8}
                    fill="var(--color-total)"
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </RechartsBarChart>
              </ChartContainer>
            ) : (
              <EmptyState label="No hay proyectos para mostrar." />
            )}
          </TabsContent>

          <TabsContent value="timeline" className="pt-4">
            {timelineData.some((item) => item.total > 0) ? (
              <ChartContainer config={timelineConfig} className="h-[320px] w-full">
                <RechartsBarChart
                  data={timelineData}
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="pending"
                    stackId="activity"
                    name="Pendiente"
                    fill="var(--color-pending)"
                    radius={8}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="finished"
                    stackId="activity"
                    name="Finalizado"
                    fill="var(--color-finished)"
                    radius={8}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </RechartsBarChart>
              </ChartContainer>
            ) : (
              <EmptyState label="No hay datos de tendencia." />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
