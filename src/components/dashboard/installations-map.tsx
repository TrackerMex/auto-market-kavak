import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";

import "leaflet/dist/leaflet.css";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InstallationMapPoint } from "@/lib/dashboard-analytics";

interface InstallationsMapProps {
  points: InstallationMapPoint[];
}

interface ClusterPoint {
  id: string;
  lat: number;
  lng: number;
  count: number;
  finishedCount: number;
  pendingCount: number;
  sample: InstallationMapPoint;
}

interface LeafletComponents {
  MapContainer: ComponentType<{
    center: [number, number];
    zoom: number;
    scrollWheelZoom?: boolean;
    style?: { height: number; width: string };
    children?: ReactNode;
  }>;
  TileLayer: ComponentType<{
    attribution?: string;
    url: string;
  }>;
  CircleMarker: ComponentType<{
    center: [number, number];
    radius: number;
    pathOptions?: {
      color?: string;
      fillColor?: string;
      fillOpacity?: number;
      weight?: number;
    };
    children?: ReactNode;
  }>;
  Circle: ComponentType<{
    center: [number, number];
    radius: number;
    pathOptions?: {
      color?: string;
      fillColor?: string;
      fillOpacity?: number;
      weight?: number;
    };
    children?: ReactNode;
  }>;
  Popup: ComponentType<{ children?: ReactNode }>;
}

const DEFAULT_CENTER: [number, number] = [19.432608, -99.133209];
const GRID_SIZE = 0.025;

function clusterPoints(points: InstallationMapPoint[]): ClusterPoint[] {
  const clusters = new Map<
    string,
    {
      latAccumulator: number;
      lngAccumulator: number;
      count: number;
      finishedCount: number;
      pendingCount: number;
      sample: InstallationMapPoint;
    }
  >();

  for (const point of points) {
    const bucketX = Math.round(point.lat / GRID_SIZE);
    const bucketY = Math.round(point.lng / GRID_SIZE);
    const key = `${bucketX}:${bucketY}`;
    const entry = clusters.get(key);

    if (entry) {
      entry.latAccumulator += point.lat;
      entry.lngAccumulator += point.lng;
      entry.count += 1;
      if (point.status === "FINALIZADO") {
        entry.finishedCount += 1;
      } else {
        entry.pendingCount += 1;
      }
      continue;
    }

    clusters.set(key, {
      latAccumulator: point.lat,
      lngAccumulator: point.lng,
      count: 1,
      finishedCount: point.status === "FINALIZADO" ? 1 : 0,
      pendingCount: point.status === "PENDIENTE" ? 1 : 0,
      sample: point,
    });
  }

  return [...clusters.entries()].map(([key, value]) => ({
    id: key,
    lat: value.latAccumulator / value.count,
    lng: value.lngAccumulator / value.count,
    count: value.count,
    finishedCount: value.finishedCount,
    pendingCount: value.pendingCount,
    sample: value.sample,
  }));
}

function getClusterColor(cluster: ClusterPoint): string {
  if (cluster.finishedCount >= cluster.pendingCount) {
    return "#10b981";
  }

  return "#f59e0b";
}

export function InstallationsMap({ points }: InstallationsMapProps) {
  const [components, setComponents] = useState<LeafletComponents | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let isMounted = true;

    async function loadMap() {
      const [reactLeaflet, leafletModule] = await Promise.all([
        import("react-leaflet"),
        import("leaflet"),
      ]);

      const Leaflet = leafletModule.default;
      Leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!isMounted) {
        return;
      }

      setComponents({
        MapContainer: reactLeaflet.MapContainer as unknown as LeafletComponents["MapContainer"],
        TileLayer: reactLeaflet.TileLayer as unknown as LeafletComponents["TileLayer"],
        CircleMarker: reactLeaflet.CircleMarker as unknown as LeafletComponents["CircleMarker"],
        Circle: reactLeaflet.Circle as unknown as LeafletComponents["Circle"],
        Popup: reactLeaflet.Popup as unknown as LeafletComponents["Popup"],
      });
    }

    void loadMap();

    return () => {
      isMounted = false;
    };
  }, []);

  const center = useMemo<[number, number]>(() => {
    if (points.length === 0) {
      return DEFAULT_CENTER;
    }

    const aggregate = points.reduce(
      (accumulator, point) => {
        accumulator.lat += point.lat;
        accumulator.lng += point.lng;
        return accumulator;
      },
      { lat: 0, lng: 0 },
    );

    return [aggregate.lat / points.length, aggregate.lng / points.length];
  }, [points]);

  const clusters = useMemo(() => clusterPoints(points), [points]);
  const hasPoints = points.length > 0;

  return (
    <Card id="mapa" className="overflow-hidden">
      <CardHeader>
        <CardTitle>Mapa operativo</CardTitle>
        <CardDescription>
          Agrupacion por zonas para check-ins/check-outs y capa de calor por densidad.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {components && hasPoints ? (
          <Tabs defaultValue="clusters" className="w-full">
            <TabsList>
              <TabsTrigger value="clusters">Clusters</TabsTrigger>
              <TabsTrigger value="heat">Heatmap</TabsTrigger>
            </TabsList>

            <TabsContent value="clusters" className="pt-3">
              <div className="overflow-hidden rounded-xl border border-border">
                <components.MapContainer
                  center={center}
                  zoom={10}
                  scrollWheelZoom
                  style={{ height: 340, width: "100%" }}
                >
                  <components.TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {clusters.map((cluster) => (
                    <components.CircleMarker
                      key={cluster.id}
                      center={[cluster.lat, cluster.lng]}
                      radius={Math.min(18, 6 + cluster.count * 1.2)}
                      pathOptions={{
                        color: getClusterColor(cluster),
                        fillColor: getClusterColor(cluster),
                        fillOpacity: 0.45,
                        weight: 1.5,
                      }}
                    >
                      <components.Popup>
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">Zona agregada</p>
                          <p>Total puntos: {cluster.count}</p>
                          <p>Finalizado: {cluster.finishedCount}</p>
                          <p>Pendiente: {cluster.pendingCount}</p>
                          <p>Proyecto: {cluster.sample.project}</p>
                        </div>
                      </components.Popup>
                    </components.CircleMarker>
                  ))}
                </components.MapContainer>
              </div>
            </TabsContent>

            <TabsContent value="heat" className="pt-3">
              <div className="overflow-hidden rounded-xl border border-border">
                <components.MapContainer
                  center={center}
                  zoom={10}
                  scrollWheelZoom
                  style={{ height: 340, width: "100%" }}
                >
                  <components.TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {clusters.map((cluster) => (
                    <components.Circle
                      key={`heat-${cluster.id}`}
                      center={[cluster.lat, cluster.lng]}
                      radius={Math.max(300, cluster.count * 170)}
                      pathOptions={{
                        color: "#f97316",
                        fillColor: "#fb923c",
                        fillOpacity: Math.min(0.45, 0.08 + cluster.count * 0.03),
                        weight: 0,
                      }}
                    >
                      <components.Popup>
                        <p className="text-xs font-medium">Intensidad: {cluster.count} puntos</p>
                      </components.Popup>
                    </components.Circle>
                  ))}
                </components.MapContainer>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-muted-foreground flex h-[340px] items-center justify-center rounded-xl border border-dashed border-border text-sm">
            {components ? "No hay coordenadas validas para mostrar en el mapa." : "Cargando mapa..."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
