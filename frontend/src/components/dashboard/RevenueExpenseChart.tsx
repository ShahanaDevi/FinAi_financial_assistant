import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { month: "Jan", revenue: 45000, expenses: 32000 },
  { month: "Feb", revenue: 52000, expenses: 38000 },
  { month: "Mar", revenue: 48000, expenses: 35000 },
  { month: "Apr", revenue: 61000, expenses: 42000 },
  { month: "May", revenue: 55000, expenses: 39000 },
  { month: "Jun", revenue: 67000, expenses: 45000 },
];

const RevenueExpenseChart = () => {
  return (
    <div className="metric-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">Revenue vs Expenses</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" className="text-muted-foreground" tick={{ fill: 'hsl(215 15% 45%)' }} />
            <YAxis className="text-muted-foreground" tick={{ fill: 'hsl(215 15% 45%)' }} tickFormatter={(value) => `$${value / 1000}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0 0% 100%)',
                border: '1px solid hsl(214 20% 90%)',
                borderRadius: '0.5rem',
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(217 91% 50%)"
              strokeWidth={2}
              dot={{ fill: 'hsl(217 91% 50%)', strokeWidth: 2 }}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="hsl(199 89% 48%)"
              strokeWidth={2}
              dot={{ fill: 'hsl(199 89% 48%)', strokeWidth: 2 }}
              name="Expenses"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueExpenseChart;
