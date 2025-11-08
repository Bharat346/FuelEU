import { useState } from "react";
import { Ship, GitCompare, Building2, Users } from "lucide-react";
import RoutesTab from "@/components/tabs/routes-tab";
import CompareTab from "@/components/tabs/compare-tab";
import BankingTab from "@/components/tabs/banking-tab";
import PoolingTab from "@/components/tabs/pooling-tab";

type TabId = "routes" | "compare" | "banking" | "pooling";

interface Tab {
  id: TabId;
  label: string;
  icon: typeof Ship;
}

const tabs: Tab[] = [
  { id: "routes", label: "Routes", icon: Ship },
  { id: "compare", label: "Compare", icon: GitCompare },
  { id: "banking", label: "Banking", icon: Building2 },
  { id: "pooling", label: "Pooling", icon: Users },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("routes");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground" data-testid="text-page-title">
                FuelEU Maritime Compliance
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor emissions, manage compliance balance, and optimize pooling strategies
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Target Intensity (2025)</div>
                <div className="text-sm font-mono font-semibold text-foreground">
                  89.3368 gCO₂e/MJ
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <nav className="flex gap-1" role="tablist">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${tab.id}-panel`}
                  data-testid={`button-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 text-sm font-medium 
                    border-b-2 transition-colors hover-elevate
                    ${
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div
          role="tabpanel"
          id="routes-panel"
          aria-labelledby="routes-tab"
          className={activeTab === "routes" ? "block" : "hidden"}
        >
          <RoutesTab />
        </div>
        <div
          role="tabpanel"
          id="compare-panel"
          aria-labelledby="compare-tab"
          className={activeTab === "compare" ? "block" : "hidden"}
        >
          <CompareTab />
        </div>
        <div
          role="tabpanel"
          id="banking-panel"
          aria-labelledby="banking-tab"
          className={activeTab === "banking" ? "block" : "hidden"}
        >
          <BankingTab />
        </div>
        <div
          role="tabpanel"
          id="pooling-panel"
          aria-labelledby="pooling-tab"
          className={activeTab === "pooling" ? "block" : "hidden"}
        >
          <PoolingTab />
        </div>
      </main>
    </div>
  );
}
