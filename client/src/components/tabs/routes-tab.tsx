import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Route } from "@shared/schema";

export default function RoutesTab() {
  const { toast } = useToast();
  const [vesselTypeFilter, setVesselTypeFilter] = useState<string>("all");
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const { data: routes, isLoading } = useQuery<Route[]>({
    queryKey: ["/api/routes"],
  });

  const setBaselineMutation = useMutation({
    mutationFn: async (routeId: string) => {
      return apiRequest("POST", `/api/routes/${routeId}/baseline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      toast({
        title: "Baseline Updated",
        description: "The baseline route has been set successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set baseline. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredRoutes = routes?.filter((route) => {
    if (vesselTypeFilter !== "all" && route.vesselType !== vesselTypeFilter) return false;
    if (fuelTypeFilter !== "all" && route.fuelType !== fuelTypeFilter) return false;
    if (yearFilter !== "all" && route.year.toString() !== yearFilter) return false;
    return true;
  });

  const vesselTypes = Array.from(new Set(routes?.map((r) => r.vesselType) || []));
  const fuelTypes = Array.from(new Set(routes?.map((r) => r.fuelType) || []));
  const years = Array.from(new Set(routes?.map((r) => r.year.toString()) || []));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Route Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage vessel routes with emissions data
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Vessel Type
              </label>
              <Select value={vesselTypeFilter} onValueChange={setVesselTypeFilter}>
                <SelectTrigger data-testid="select-vessel-type">
                  <SelectValue placeholder="All Vessel Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vessel Types</SelectItem>
                  {vesselTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Fuel Type
              </label>
              <Select value={fuelTypeFilter} onValueChange={setFuelTypeFilter}>
                <SelectTrigger data-testid="select-fuel-type">
                  <SelectValue placeholder="All Fuel Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fuel Types</SelectItem>
                  {fuelTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Year
              </label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger data-testid="select-year">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Routes Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="text-sm text-muted-foreground mt-4">Loading routes...</p>
            </div>
          ) : filteredRoutes && filteredRoutes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      Route ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      Vessel Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      Fuel Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      Year
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                      GHG Intensity
                      <span className="text-xs text-muted-foreground ml-1">(gCO₂e/MJ)</span>
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                      Fuel Consumption
                      <span className="text-xs text-muted-foreground ml-1">(t)</span>
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                      Distance
                      <span className="text-xs text-muted-foreground ml-1">(km)</span>
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                      Total Emissions
                      <span className="text-xs text-muted-foreground ml-1">(t)</span>
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRoutes.map((route, index) => (
                    <tr
                      key={route.id}
                      className="hover-elevate"
                      data-testid={`row-route-${route.routeId}`}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-foreground">
                        <div className="flex items-center gap-2">
                          {route.routeId}
                          {route.isBaseline && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Baseline
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{route.vesselType}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{route.fuelType}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{route.year}</td>
                      <td className="px-4 py-3 text-sm font-mono text-right text-foreground">
                        {route.ghgIntensity.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-right text-foreground">
                        {route.fuelConsumption.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-right text-foreground">
                        {route.distance.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-right text-foreground">
                        {route.totalEmissions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          variant={route.isBaseline ? "secondary" : "outline"}
                          disabled={route.isBaseline || setBaselineMutation.isPending}
                          onClick={() => setBaselineMutation.mutate(route.routeId)}
                          data-testid={`button-set-baseline-${route.routeId}`}
                        >
                          {route.isBaseline ? "Is Baseline" : "Set Baseline"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No routes found matching the filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
