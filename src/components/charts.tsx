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
  AreaChart,
  Area,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

interface IncomeExpenseData {
  name: string;
  income: number;
  expense: number;
}

interface SpendingData {
  name: string;
  value: number;
}

export function IncomeExpenseChart({ data }: { data: IncomeExpenseData[] }) {
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

export function SpendingPieChart({ data }: { data: SpendingData[] }) {
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
          label={({ name, percent }: { name?: string | number; percent?: number }) => `${name ?? ""} ${((percent || 0) * 100).toFixed(0)}%`}
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

export function GenericPieChart({ data }: { data: SpendingData[] }) {
    const formattedData = data.map(d => ({
        ...d,
        value: Math.abs(d.value) / 100
    }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={formattedData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: { name?: string | number; percent?: number }) => `${name ?? ""} ${((percent || 0) * 100).toFixed(0)}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {formattedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function NetWorthChart({ data }: { data: { name: string; value: number }[] }) {
    const formattedData = data.map(d => ({
        ...d,
        value: d.value / 100
    }));

    return (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={formattedData}>
                <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#818cf8" 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    name="Net Worth"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
