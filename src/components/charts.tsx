"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export function IncomeExpenseChart({ data }: { data: any[] }) {
  // Convert cents to dollars for display
  const formattedData = data.map(d => ({
      ...d,
      income: d.income / 100,
      expense: d.expense / 100
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => `$${value}`} />
        <Legend />
        <Bar dataKey="income" fill="#4ade80" name="Income" />
        <Bar dataKey="expense" fill="#f87171" name="Expense" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SpendingPieChart({ data }: { data: any[] }) {
    const formattedData = data.map(d => ({
        ...d,
        value: d.value / 100
    }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={formattedData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {formattedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `$${value}`} />
      </PieChart>
    </ResponsiveContainer>
  );
}
