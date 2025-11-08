import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, TrendingDown, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import type { ComparisonResult } from "@shared/schema";

const TARGET_INTENSITY = 89.3368;

export default function CompareTab() {
  const { data: comparisons, isLoading } = useQuery<ComparisonResult[]>({
    queryKey: ["/api/routes/comparison"],
  });

  const baseline = comparisons?.find((c) => c.route.isBaseline);

  const chartData = comparisons?.map((comp) => ({
    name: comp.route.routeId,
    intensity: parseFloat(comp.route.ghgIntensity.toFixed(2)),
    target: TARGET_INTENSITY,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Compliance Comparison</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Compare route GHG intensities against the baseline and 2025 target
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Target Intensity (2025)</div>
            <div className="text-3xl font-bold font-mono text-foreground">
              {TARGET_INTENSITY.toFixed(4)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">gCO₂e/MJ</div>
          </CardContent>
        </Card>

        {baseline && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-2">Baseline Intensity</div>
                <div className="text-3xl font-bold font-mono text-foreground">
                  {baseline.route.ghgIntensity.toFixed(4)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {baseline.route.routeId} • {baseline.route.year}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-2">
                  Compliant Routes
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {comparisons?.filter((c) => c.compliant).length || 0}
                  <span className="text-xl text-muted-foreground">
                    /{comparisons?.length || 0}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {comparisons && comparisons.length > 0
                    ? `${((comparisons.filter((c) => c.compliant).length / comparisons.length) * 100).toFixed(0)}% compliance rate`
                    : "No data"}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Comparison Chart */}
      {comparisons && comparisons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">GHG Intensity Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs" 
                  tick={{ fill: "hsl(var(--foreground))" }}
                />
                <YAxis 
                  className="text-xs" 
                  tick={{ fill: "hsl(var(--foreground))" }}
                  label={{ 
                    value: "gCO₂e/MJ", 
                    angle: -90, 
                    position: "insideLeft",
                    style: { fill: "hsl(var(--foreground))" }
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                <ReferenceLine 
                  y={TARGET_INTENSITY} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="3 3"
                  label={{ value: "Target", fill: "hsl(var(--destructive))" }}
                />
                <Bar 
                  dataKey="intensity" 
                  fill="hsl(var(--primary))" 
                  name="GHG Intensity"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="text-sm text-muted-foreground mt-4">Loading comparisons...</p>
            </div>
          ) : comparisons && comparisons.length > 0 ? (
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
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                      GHG Intensity
                      <span className="text-xs text-muted-foreground ml-1">(gCO₂e/MJ)</span>
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                      vs Baseline
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                      vs Target
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {comparisons.map((comp) => {
                    const vsTarget = ((comp.route.ghgIntensity / TARGET_INTENSITY - 1) * 100);
                    return (
                      <tr
                        key={comp.route.id}
                        className="hover-elevate"
                        data-testid={`row-comparison-${comp.route.routeId}`}
                      >
                        <td className="px-4 py-3 text-sm font-mono text-foreground">
                          {comp.route.routeId}
                          {comp.route.isBaseline && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Baseline
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {comp.route.vesselType}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {comp.route.fuelType}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-right text-foreground">
                          {comp.route.ghgIntensity.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-right">
                          {comp.route.isBaseline ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span
                              className={
                                comp.percentDiff < 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }
                            >
                              {comp.percentDiff > 0 && "+"}
                              {comp.percentDiff.toFixed(2)}%
                              {comp.percentDiff < 0 ? (
                                <TrendingDown className="inline w-4 h-4 ml-1" />
                              ) : (
                                <TrendingUp className="inline w-4 h-4 ml-1" />
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-right">
                          <span
                            className={
                              vsTarget < 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }
                          >
                            {vsTarget > 0 && "+"}
                            {vsTarget.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={comp.compliant ? "default" : "destructive"}
                            data-testid={`badge-compliance-${comp.route.routeId}`}
                          >
                            {comp.compliant ? (
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-1" />
                            )}
                            {comp.compliant ? "Compliant" : "Non-Compliant"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">
                No baseline route set. Please set a baseline in the Routes tab to enable comparisons.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
