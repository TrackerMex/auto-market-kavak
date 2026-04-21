import { ActivityIcon, Clock3Icon, ListChecksIcon, TargetIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardMetrics } from "@/lib/dashboard-analytics";

interface SectionCardsProps {
  metrics: DashboardMetrics;
}

export function SectionCards({ metrics }: SectionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs md:grid-cols-2 xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total de registros</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.total.toLocaleString("es-MX")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ListChecksIcon />
              Base total
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="text-muted-foreground text-xs">
          Pendientes: {metrics.pending.toLocaleString("es-MX")} / Finalizados: {metrics.finished.toLocaleString("es-MX")}
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tasa de finalizacion</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.completionRate}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TargetIcon />
              Efectividad
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="text-muted-foreground text-xs">
          Basado en el total filtrado de instalaciones.
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Avance promedio</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.avgProgress}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ActivityIcon />
              Ejecucion
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="text-muted-foreground text-xs">
          Promedio de porcentaje de avance reportado.
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Ciclo promedio</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.avgCycleHours} h
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Clock3Icon />
              Velocidad
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="text-muted-foreground text-xs">
          Tiempo estimado entre check-in y check-out.
        </CardFooter>
      </Card>
    </div>
  );
}
