import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface Props {
  revenue: number;
  expenses: number;
  profitMargin: number;
  cashFlow: number;
}

const COLORS = ["#22c55e", "#ef4444"];

const FinancialCharts = ({
  revenue,
  expenses,
  profitMargin,
  cashFlow,
}: Props) => {
  const barData = [
    { name: "Revenue", value: revenue },
    { name: "Expenses", value: expenses },
  ];

  const pieData = [
    { name: "Profit", value: profitMargin },
    { name: "Remaining", value: 100 - profitMargin },
  ];

  const lineData = [
    { month: "Current", value: cashFlow },
    { month: "Next", value: cashFlow * 1.05 },
    { month: "Future", value: cashFlow * 1.1 },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">

      {/* Revenue vs Expenses */}
      <div className="metric-card">
        <h3 className="font-semibold mb-3">Revenue vs Expenses</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Profit Margin */}
      <div className="metric-card">
        <h3 className="font-semibold mb-3">Profit Margin</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              innerRadius={60}
              outerRadius={90}
            >
              {pieData.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <p className="text-center font-bold mt-2">{profitMargin}%</p>
      </div>

      {/* Cash Flow Trend */}
      <div className="metric-card">
        <h3 className="font-semibold mb-3">Cash Flow Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={lineData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#22c55e"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default FinancialCharts;
