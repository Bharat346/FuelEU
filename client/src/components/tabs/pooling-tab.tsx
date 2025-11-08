import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ComplianceBalanceResponse, PoolCreationRequest, PoolCreationResponse } from "@shared/schema";

interface PoolMember {
  shipId: string;
  cbBefore: number;
}

export default function PoolingTab() {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [newShipId, setNewShipId] = useState<string>("");
  const [poolMembers, setPoolMembers] = useState<PoolMember[]>([]);

  const createPoolMutation = useMutation({
    mutationFn: async (request: PoolCreationRequest) => {
      return apiRequest<PoolCreationResponse>("POST", "/api/pools", request);
    },
    onSuccess: (data) => {
      setPoolMembers([]);
      toast({
        title: "Pool Created Successfully",
        description: `Pool #${data.poolId} created with ${data.members.length} members.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Pool Creation Failed",
        description: error.message || "Unable to create pool. Please check validation rules.",
        variant: "destructive",
      });
    },
  });

  const addMember = async () => {
    if (!newShipId) {
      toast({
        title: "Invalid Input",
        description: "Please enter a ship ID",
        variant: "destructive",
      });
      return;
    }

    if (poolMembers.some(m => m.shipId === newShipId)) {
      toast({
        title: "Duplicate Ship",
        description: "This ship is already in the pool",
        variant: "destructive",
      });
      return;
    }

    try {
      // Fetch real CB data from backend
      const response = await fetch(`/api/compliance/cb?shipId=${newShipId}&year=${selectedYear}`);
      if (!response.ok) {
        throw new Error("Failed to fetch compliance balance");
      }
      
      const data: ComplianceBalanceResponse = await response.json();
      
      setPoolMembers([...poolMembers, { 
        shipId: newShipId, 
        cbBefore: data.cb 
      }]);
      setNewShipId("");
      
      toast({
        title: "Member Added",
        description: `${newShipId} added with CB: ${data.cb.toLocaleString()} gCO₂eq`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch compliance balance for this ship",
        variant: "destructive",
      });
    }
  };

  const removeMember = (shipId: string) => {
    setPoolMembers(poolMembers.filter(m => m.shipId !== shipId));
  };

  const totalSum = poolMembers.reduce((sum, m) => sum + m.cbBefore, 0);
  const isValidPool = totalSum >= 0;
  const hasDeficit = poolMembers.some(m => m.cbBefore < 0);
  const hasSurplus = poolMembers.some(m => m.cbBefore > 0);

  const handleCreatePool = () => {
    if (poolMembers.length < 2) {
      toast({
        title: "Insufficient Members",
        description: "A pool requires at least 2 members",
        variant: "destructive",
      });
      return;
    }

    createPoolMutation.mutate({
      year: selectedYear,
      members: poolMembers,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Pooling (Article 21)</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Create compliance pools to redistribute surplus and deficit balances
        </p>
      </div>

      {/* Year Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="poolYear">Pool Year</Label>
              <Input
                id="poolYear"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                placeholder="Year"
                data-testid="input-pool-year"
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Member */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Pool Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                value={newShipId}
                onChange={(e) => setNewShipId(e.target.value)}
                placeholder="Enter ship ID (e.g., SHIP001)"
                data-testid="input-new-ship-id"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    addMember();
                  }
                }}
              />
            </div>
            <Button onClick={addMember} data-testid="button-add-member">
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Compliance balance will be fetched from the system for the selected year.
          </p>
        </CardContent>
      </Card>

      {/* Pool Preview */}
      {poolMembers.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Pool Members ({poolMembers.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                        Ship ID
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                        CB Before (gCO₂eq)
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {poolMembers.map((member) => {
                      const isDeficitShip = member.cbBefore < 0;
                      return (
                        <tr key={member.shipId} className="hover-elevate" data-testid={`row-member-${member.shipId}`}>
                          <td className="px-4 py-3 text-sm font-mono text-foreground">
                            {member.shipId}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm font-mono text-right ${
                              isDeficitShip
                                ? "text-red-600 dark:text-red-400"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {member.cbBefore >= 0 && "+"}
                            {member.cbBefore.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={isDeficitShip ? "destructive" : "default"}>
                              {isDeficitShip ? "Deficit" : "Surplus"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeMember(member.shipId)}
                              data-testid={`button-remove-${member.shipId}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pool Validation Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pool Validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Total Pool Sum</div>
                <div
                  className={`text-3xl font-bold font-mono ${
                    totalSum >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                  data-testid="text-pool-sum"
                >
                  {totalSum >= 0 && "+"}
                  {totalSum.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-muted-foreground mt-1">gCO₂eq</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {isValidPool ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                  <span className={isValidPool ? "text-foreground" : "text-muted-foreground"}>
                    Sum ≥ 0
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {poolMembers.length >= 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                  <span className={poolMembers.length >= 2 ? "text-foreground" : "text-muted-foreground"}>
                    Minimum 2 members
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {hasDeficit && hasSurplus ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={hasDeficit && hasSurplus ? "text-foreground" : "text-muted-foreground"}>
                    Mix of deficit & surplus
                  </span>
                </div>
              </div>

              <Button
                onClick={handleCreatePool}
                disabled={!isValidPool || poolMembers.length < 2 || createPoolMutation.isPending}
                className="w-full"
                data-testid="button-create-pool"
              >
                {createPoolMutation.isPending ? "Creating Pool..." : "Create Pool"}
              </Button>

              {!isValidPool && poolMembers.length >= 2 && (
                <p className="text-xs text-muted-foreground">
                  Pool creation disabled: total sum must be ≥ 0
                </p>
              )}

              {poolMembers.length < 2 && (
                <p className="text-xs text-muted-foreground">
                  Add at least 2 members to create a pool
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {poolMembers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No members added yet. Add ships to start creating a compliance pool.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-2">Pooling Rules (Article 21)</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Total pool sum must be ≥ 0 (∑ CB ≥ 0)</li>
            <li>Deficit ships cannot exit worse than they entered</li>
            <li>Surplus ships cannot exit with negative CB</li>
            <li>Greedy allocation: surplus transferred to deficits in order</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
