import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ComplianceBalanceResponse, BankEntry } from "@shared/schema";

export default function BankingTab() {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [shipId, setShipId] = useState<string>("SHIP001");
  const [bankAmount, setBankAmount] = useState<string>("");
  const [applyAmount, setApplyAmount] = useState<string>("");

  const { data: cbData } = useQuery<ComplianceBalanceResponse>({
    queryKey: ["/api/compliance/cb", shipId, selectedYear],
    enabled: !!shipId,
  });

  const { data: bankRecords } = useQuery<BankEntry[]>({
    queryKey: ["/api/banking/records", shipId, selectedYear],
    enabled: !!shipId,
  });

  const bankMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/banking/bank", {
        shipId,
        year: selectedYear,
        amount: parseFloat(bankAmount),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/cb"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banking/records"] });
      setBankAmount("");
      toast({
        title: "Surplus Banked",
        description: "The positive compliance balance has been banked successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Banking Failed",
        description: error.message || "Unable to bank surplus. Please check your inputs.",
        variant: "destructive",
      });
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/banking/apply", {
        shipId,
        year: selectedYear,
        amount: parseFloat(applyAmount),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/cb"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banking/records"] });
      setApplyAmount("");
      toast({
        title: "Banked Surplus Applied",
        description: "The banked surplus has been applied to the deficit successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Application Failed",
        description: error.message || "Unable to apply banked surplus. Please check your inputs.",
        variant: "destructive",
      });
    },
  });

  const totalBanked = bankRecords?.reduce((sum, entry) => sum + entry.amountGco2eq, 0) || 0;
  const currentCB = cbData?.cb || 0;
  const isSurplus = currentCB > 0;
  const isDeficit = currentCB < 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Banking (Article 20)</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Bank positive compliance balance or apply banked surplus to deficits
        </p>
      </div>

      {/* Ship Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="shipId">Ship ID</Label>
              <Input
                id="shipId"
                value={shipId}
                onChange={(e) => setShipId(e.target.value)}
                placeholder="Enter ship ID"
                data-testid="input-ship-id"
                className="mt-2"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                placeholder="Year"
                data-testid="input-year"
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Current CB</div>
              {isSurplus ? (
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : isDeficit ? (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              ) : null}
            </div>
            <div
              className={`text-3xl font-bold font-mono ${
                isSurplus
                  ? "text-green-600 dark:text-green-400"
                  : isDeficit
                  ? "text-red-600 dark:text-red-400"
                  : "text-foreground"
              }`}
              data-testid="text-current-cb"
            >
              {currentCB >= 0 && "+"}
              {currentCB.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">gCO₂eq</div>
            <Badge variant={isSurplus ? "default" : isDeficit ? "destructive" : "secondary"} className="mt-2">
              {isSurplus ? "Surplus" : isDeficit ? "Deficit" : "Neutral"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Total Banked</div>
              <Building2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold font-mono text-foreground" data-testid="text-total-banked">
              {totalBanked.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">gCO₂eq available</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Banking Records</div>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {bankRecords?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total entries for {shipId}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banking Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bank Surplus */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4" />
              Bank Surplus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bank your positive compliance balance for future use. Only available when CB {"> "}0.
            </p>
            <div>
              <Label htmlFor="bankAmount">Amount to Bank (gCO₂eq)</Label>
              <Input
                id="bankAmount"
                type="number"
                value={bankAmount}
                onChange={(e) => setBankAmount(e.target.value)}
                placeholder="Enter amount"
                disabled={!isSurplus}
                data-testid="input-bank-amount"
                className="mt-2"
              />
            </div>
            <Button
              onClick={() => bankMutation.mutate()}
              disabled={!isSurplus || !bankAmount || parseFloat(bankAmount) <= 0 || bankMutation.isPending}
              className="w-full"
              data-testid="button-bank-surplus"
            >
              {bankMutation.isPending ? "Banking..." : "Bank Surplus"}
            </Button>
            {!isSurplus && (
              <p className="text-xs text-muted-foreground">
                Banking is disabled because current CB is not positive
              </p>
            )}
          </CardContent>
        </Card>

        {/* Apply Banked */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpFromLine className="w-4 h-4" />
              Apply Banked Surplus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Apply previously banked surplus to cover a deficit. Available banked: {totalBanked.toLocaleString()} gCO₂eq.
            </p>
            <div>
              <Label htmlFor="applyAmount">Amount to Apply (gCO₂eq)</Label>
              <Input
                id="applyAmount"
                type="number"
                value={applyAmount}
                onChange={(e) => setApplyAmount(e.target.value)}
                placeholder="Enter amount"
                disabled={totalBanked <= 0}
                data-testid="input-apply-amount"
                className="mt-2"
              />
            </div>
            <Button
              onClick={() => applyMutation.mutate()}
              disabled={totalBanked <= 0 || !applyAmount || parseFloat(applyAmount) <= 0 || applyMutation.isPending}
              className="w-full"
              data-testid="button-apply-banked"
            >
              {applyMutation.isPending ? "Applying..." : "Apply Banked Surplus"}
            </Button>
            {totalBanked <= 0 && (
              <p className="text-xs text-muted-foreground">
                No banked surplus available to apply
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Banking History */}
      {bankRecords && bankRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Banking History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      Ship ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      Year
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                      Amount (gCO₂eq)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bankRecords.map((entry) => (
                    <tr key={entry.id} className="hover-elevate">
                      <td className="px-4 py-3 text-sm text-foreground">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-foreground">
                        {entry.shipId}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{entry.year}</td>
                      <td className="px-4 py-3 text-sm font-mono text-right text-green-600 dark:text-green-400">
                        +{entry.amountGco2eq.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
