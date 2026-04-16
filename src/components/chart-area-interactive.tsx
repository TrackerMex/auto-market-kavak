import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface ChartAreaInteractiveProps {
  statusData: StatusChartDatum[];
  projectData: ProjectProgressDatum[];
  timelineData: TimelineDatum[];
}

const statusConfig = {
  PENDIENTE: {
    label: "Pendiente",
    color: "var(--color-chart-3)",
  },
  FINALIZADO: {
    label: "Finalizado",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

const projectConfig = {
  avgProgress: {
    label: "Avance",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig;

const timelineConfig = {
  finished: {
    label: "Finalizado",
    color: "var(--color-chart-1)",
  },
  pending: {
    label: "Pendiente",
    color: "var(--color-chart-3)",
  },
} satisfies ChartConfig;

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-muted-foreground flex h-[260px] items-center justify-center text-sm">{label}</div>
  );
}

export function ChartAreaInteractive({
  statusData,
  projectData,
  timelineData,
}: ChartAreaInteractiveProps) {
  return (
    <Card id="graficas" className="@container/card">
      <CardHeader>
        <CardTitle>Analitica operativa</CardTitle>
        <CardDescription>
          Distribucion por estatus, avance por proyecto y tendencia de actividad.
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
              <ChartContainer config={statusConfig} className="h-[280px] w-full">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent formatter={(value) => `${String(value)} instalaciones`} />}
                  />
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {statusData.map((slice) => (
                      <Cell
                        key={slice.key}
                        fill={
                          slice.key === "FINALIZADO"
                            ? "var(--color-FINALIZADO)"
                            : "var(--color-PENDIENTE)"
                        }
                      />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyState label="No hay datos para generar la distribucion." />
            )}
          </TabsContent>

          <TabsContent value="projects" className="pt-4">
            {projectData.length > 0 ? (
              <ChartContainer config={projectConfig} className="h-[300px] w-full">
                <BarChart data={projectData} margin={{ left: 8, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="project"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval={0}
                    tickFormatter={(value: string) => (value.length > 16 ? `${value.slice(0, 16)}...` : value)}
                  />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={34} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent formatter={(value) => `${String(value)}%`} />}
                  />
                  <Bar dataKey="avgProgress" radius={[6, 6, 0, 0]} fill="var(--color-avgProgress)" />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState label="No hay proyectos suficientes para graficar." />
            )}
          </TabsContent>

          <TabsContent value="timeline" className="pt-4">
            {timelineData.some((item) => item.total > 0) ? (
              <ChartContainer config={timelineConfig} className="h-[300px] w-full">
                <AreaChart data={timelineData} margin={{ left: 8, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="fillTimelineFinished" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-finished)" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="var(--color-finished)" stopOpacity={0.06} />
                    </linearGradient>
                    <linearGradient id="fillTimelinePending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-pending)" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="var(--color-pending)" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={20} />
                  <YAxis tickLine={false} axisLine={false} width={34} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" formatter={(value) => String(value)} />}
                  />
                  <Area
                    dataKey="pending"
                    type="monotone"
                    stroke="var(--color-pending)"
                    fill="url(#fillTimelinePending)"
                    stackId="activity"
                  />
                  <Area
                    dataKey="finished"
                    type="monotone"
                    stroke="var(--color-finished)"
                    fill="url(#fillTimelineFinished)"
                    stackId="activity"
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            ) : (
              <EmptyState label="Sin actividad reciente para la linea de tiempo." />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
