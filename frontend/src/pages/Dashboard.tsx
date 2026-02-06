import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import FinancialCharts from "@/components/dashboard/FinancialCharts";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";


interface RecommendedProduct {
  product: string;
  provider: string;
  reason: string;
}

interface AnalysisData {
  revenue: number;
  expenses: number;
  profit_margin: number;
  cash_flow: number;
  health_score: number;
  creditworthiness: string;
  risks: string[];
  recommended_products: RecommendedProduct[];
  transactions?: { description?: string; amount?: number; type?: string }[];
  business_type?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookkeepingBreakdown, setBookkeepingBreakdown] = useState<
    { category: string; total: number; count: number }[] | null
  >(null);
  const [forecast, setForecast] = useState<{ next_month: number; three_months: number } | null>(
    null
  );
  const [workingCapital, setWorkingCapital] = useState<string | null>(null);
  const [enhancedError, setEnhancedError] = useState<string | null>(null);
  const [enhancedLoading, setEnhancedLoading] = useState(false);

  const state =
    (location.state as AnalysisData | null) ||
    JSON.parse(sessionStorage.getItem("analysisData") || "null");

  // If user refreshes or lands directly
  if (!state) {
    return (
      <PageLayout>
        <p className="text-center mt-10 text-muted-foreground">
          No analysis data available. Please upload a file first.
        </p>
      </PageLayout>
    );
  }

  const {
    revenue,
    expenses,
    profit_margin,
    cash_flow,
    health_score,
    creditworthiness,
    risks = [],
    recommended_products = [],
    transactions = [],
    business_type,
  } = state;

  const apiBaseUrl = "http://localhost:8000";

  useEffect(() => {
    let isMounted = true;
    const fetchEnhancements = async () => {
      try {
        setEnhancedLoading(true);
        setEnhancedError(null);

        const requests: Promise<void>[] = [];

        // Working capital insights card (always available from cash flow)
        requests.push(
          fetch(`${apiBaseUrl}/working-capital`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cash_flow }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (isMounted) {
                setWorkingCapital(data.status || null);
              }
            })
        );

        // Bookkeeping breakdown (only if transactions exist)
        if (transactions.length > 0) {
          requests.push(
            fetch(`${apiBaseUrl}/bookkeeping/categorize`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ transactions }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (!isMounted) return;
                if (data.categories && Array.isArray(data.categories)) {
                  const summary = data.categories.reduce(
                    (
                      acc: Record<string, { total: number; count: number }>,
                      item: { category: string; amount: number }
                    ) => {
                      const key = item.category || "Uncategorized";
                      if (!acc[key]) acc[key] = { total: 0, count: 0 };
                      acc[key].total += Number(item.amount || 0);
                      acc[key].count += 1;
                      return acc;
                    },
                    {}
                  );
                  const breakdown = Object.entries(summary).map(([category, stats]: [string, { total: number; count: number }]) => ({
                    category,
                    total: stats.total,
                    count: stats.count,
                  }));
                  setBookkeepingBreakdown(breakdown);
                }
              })
          );
        }

        // Forecast chart data (use transaction amounts if available)
        const amounts = transactions.map((tx) => Number(tx.amount || 0)).filter((amt) => !Number.isNaN(amt));
        if (amounts.length > 0) {
          requests.push(
            fetch(`${apiBaseUrl}/forecast`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amounts }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (!isMounted) return;
                if (data.next_month !== undefined && data.three_months !== undefined) {
                  setForecast({ next_month: data.next_month, three_months: data.three_months });
                }
              })
          );
        }

        await Promise.all(requests);
      } catch (err) {
        if (isMounted) {
          setEnhancedError("Unable to load enhanced insights.");
        }
      } finally {
        if (isMounted) {
          setEnhancedLoading(false);
        }
      }
    };

    fetchEnhancements();
    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, cash_flow, transactions]);

  const transactionNotice = useMemo(() => {
    if (transactions.length === 0) {
      return "Upload a CSV with transaction rows to unlock breakdowns and forecasts.";
    }
    return null;
  }, [transactions.length]);

  const costOptimizations = useMemo(() => {
    const insights: string[] = [];
    if (revenue > 0 && expenses / revenue > 0.7) {
      insights.push("High operating costs relative to revenue. Review fixed expenses.");
    }
    if (cash_flow < 0) {
      insights.push("Negative cash flow. Improve receivables or consider short-term working capital.");
    }

    const expenseTotals = bookkeepingBreakdown
      ? bookkeepingBreakdown
          .filter((item) => item.category !== "Revenue")
          .map((item) => Math.abs(item.total))
      : [];
    const totalExpense = expenseTotals.reduce((sum, value) => sum + value, 0);
    const rent = bookkeepingBreakdown?.find((item) => item.category === "Rent");
    if (rent && totalExpense > 0 && Math.abs(rent.total) / totalExpense > 0.3) {
      insights.push("Rent is a large share of expenses. Consider renegotiating lease terms.");
    }

    if (insights.length === 0) {
      insights.push("Costs are within healthy ranges. Keep monitoring monthly trends.");
    }
    return insights;
  }, [bookkeepingBreakdown, cash_flow, expenses, revenue]);

  const businessTypeInsight = useMemo(() => {
    if (!business_type) return null;
    if (business_type === "retail") {
      return "Retail focus: monitor inventory turns and GST compliance for sales-heavy cycles.";
    }
    if (business_type === "services") {
      return "Services focus: keep a close eye on salary costs and receivables aging.";
    }
    if (business_type === "manufacturing") {
      return "Manufacturing focus: track working capital tied up in raw materials and WIP.";
    }
    return null;
  }, [business_type]);

  const breakdownColors = ["#0ea5e9", "#22c55e", "#f97316", "#ef4444", "#a855f7"];

  const handleGenerateAI = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/ai-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics: state,
        }),
      });

      const data = await res.json();
      navigate("/insights");

    } catch (err) {
      console.error(err);
      alert("Failed to generate AI insights");
    }
  };

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your business financial health
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-4 gap-4">
          <Metric title="Health Score" value={health_score} />
          <Metric title="Creditworthiness" value={creditworthiness} />
          <Metric title="Profit Margin" value={`${profit_margin}%`} />
          <Metric title="Cash Flow" value={`₹${cash_flow}`} />
        </div>

        <FinancialCharts
          revenue={revenue}
          expenses={expenses}
          profitMargin={profit_margin}
          cashFlow={cash_flow}
        />

        {/* Revenue / Expense */}
        <div className="grid md:grid-cols-2 gap-4">
          <Metric title="Total Revenue" value={`₹${revenue}`} />
          <Metric title="Total Expenses" value={`₹${expenses}`} />
        </div>

        {/* Working Capital Insights */}
        <div className="metric-card">
          <h2 className="text-xl font-semibold mb-3">Working Capital Insights</h2>
          {enhancedLoading && !workingCapital ? (
            <p className="text-muted-foreground">Loading insights...</p>
          ) : workingCapital ? (
            <p className="text-muted-foreground">{workingCapital}</p>
          ) : (
            <p className="text-muted-foreground">No working capital insights available.</p>
          )}
        </div>

        {/* Forecast */}
        <div className="metric-card">
          <h2 className="text-xl font-semibold mb-3">Forecast</h2>
          {forecast ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={[
                  { label: "Current", value: cash_flow },
                  { label: "Next Month", value: forecast.next_month },
                  { label: "3 Months", value: forecast.three_months },
                ]}
              >
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground">
              {transactionNotice || "Forecast data not available yet."}
            </p>
          )}
        </div>

        {/* Bookkeeping Breakdown */}
        <div className="metric-card">
          <h2 className="text-xl font-semibold mb-3">Transaction Breakdown</h2>
          {bookkeepingBreakdown && bookkeepingBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={bookkeepingBreakdown.map((item) => ({
                    name: item.category,
                    value: Math.abs(item.total),
                  }))}
                  dataKey="value"
                  outerRadius={90}
                >
                  {bookkeepingBreakdown.map((_, index) => (
                    <Cell key={index} fill={breakdownColors[index % breakdownColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground">
              {transactionNotice || "Breakdown not available yet."}
            </p>
          )}
        </div>

        {/* Cost Optimization */}
        <div className="metric-card">
          <h2 className="text-xl font-semibold mb-3">Cost Optimization</h2>
          <ul className="list-disc pl-5 space-y-1">
            {costOptimizations.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Business Type Insight */}
        {businessTypeInsight ? (
          <div className="metric-card">
            <h2 className="text-xl font-semibold mb-3">Industry Focus</h2>
            <p className="text-muted-foreground">{businessTypeInsight}</p>
          </div>
        ) : null}

        {/* Risks */}
        <div className="metric-card">
          <h2 className="text-xl font-semibold mb-3">Financial Risks</h2>
          {risks.length === 0 ? (
            <p className="text-muted-foreground">No major risks detected</p>
          ) : (
            <ul className="list-disc pl-5 space-y-1">
              {risks.map((risk, idx) => (
                <li key={idx}>{risk}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Product Recommendations */}
        <div className="metric-card">
          <h2 className="text-xl font-semibold mb-3">
            Recommended Financial Products
          </h2>

          {recommended_products.length === 0 ? (
            <p className="text-muted-foreground">
              No specific product recommendations at this time.
            </p>
          ) : (
            <div className="space-y-3">
              {recommended_products.map((item, idx) => (
                <div key={idx} className="border rounded p-3">
                  <p className="font-medium">
                    {item.product} ({item.provider})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🆕 AI Financial Evaluation */}
        <div className="metric-card">
          <h2 className="text-xl font-semibold mb-3">
            AI Financial Evaluation
          </h2>

          <p className="text-muted-foreground">
            View detailed AI-driven insights on risks, optimization, and funding options.
          </p>

          <Button
            onClick={() => navigate("/insights")}
            className="mt-4"
          >
            View AI Evaluation
          </Button>
        </div>

        {/* AI Generate Button */}
        <Button
          onClick={handleGenerateAI}
          className="w-full h-12 text-base font-semibold"
        >
          Generate AI Insights
        </Button>

        {enhancedError ? (
          <p className="text-sm text-red-600">{enhancedError}</p>
        ) : null}
      </div>
    </PageLayout>
  );
};

const Metric = ({ title, value }: { title: string; value: any }) => (
  <div className="metric-card">
    <p className="text-sm text-muted-foreground">{title}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

export default Dashboard;
