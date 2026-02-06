import { AlertTriangle, TrendingDown, CreditCard, Clock } from "lucide-react";

const alerts = [
  {
    id: 1,
    icon: TrendingDown,
    title: "Declining Profit Margin",
    description: "Profit margin decreased by 5% compared to last quarter",
    severity: "warning",
  },
  {
    id: 2,
    icon: CreditCard,
    title: "High Outstanding Receivables",
    description: "₹2.5L pending payments overdue by 30+ days",
    severity: "error",
  },
  {
    id: 3,
    icon: Clock,
    title: "Inventory Turnover Slow",
    description: "Average inventory holding period increased to 45 days",
    severity: "warning",
  },
];

const RiskAlerts = () => {
  const getSeverityStyles = (severity: string) => {
    if (severity === "error") {
      return "border-destructive/30 bg-destructive/5";
    }
    return "border-warning/30 bg-warning/5";
  };

  const getIconStyles = (severity: string) => {
    if (severity === "error") {
      return "text-destructive bg-destructive/10";
    }
    return "text-warning bg-warning/10";
  };

  return (
    <div className="metric-card">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <h3 className="text-lg font-semibold text-foreground">Risk Alerts</h3>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${getSeverityStyles(alert.severity)} animate-slide-in`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${getIconStyles(alert.severity)}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RiskAlerts;
