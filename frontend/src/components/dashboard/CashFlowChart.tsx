import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { month: "Jan", cashIn: 48000, cashOut: 35000 },
  { month: "Feb", cashIn: 55000, cashOut: 42000 },
  { month: "Mar", cashIn: 51000, cashOut: 38000 },
  { month: "Apr", cashIn: 64000, cashOut: 48000 },
  { month: "May", cashIn: 58000, cashOut: 44000 },
  { month: "Jun", cashIn: 72000, cashOut: 52000 },
];

const CashFlowChart = () => {
  return (
    <div className="metric-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">Cash In vs Cash Out</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" tick={{ fill: 'hsl(215 15% 45%)' }} />
            <YAxis tick={{ fill: 'hsl(215 15% 45%)' }} tickFormatter={(value) => `$${value / 1000}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0 0% 100%)',
                border: '1px solid hsl(214 20% 90%)',
                borderRadius: '0.5rem',
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
            />
            <Legend />
            <Bar dataKey="cashIn" fill="hsl(142 76% 36%)" name="Cash In" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cashOut" fill="hsl(0 84% 60%)" name="Cash Out" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CashFlowChart;
