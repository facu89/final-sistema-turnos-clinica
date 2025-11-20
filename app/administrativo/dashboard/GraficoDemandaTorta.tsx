import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Demanda {
  codigo: string | number;
  nombre: string;
  numero: number;
}

interface GraficoDemandaTortaProps {
  demanda: Demanda[];
  height?: number;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28EFF",
  "#FF6F91",
  "#FFD6E0",
];

export const GraficoDemandaTorta: React.FC<GraficoDemandaTortaProps> = ({
  demanda,
  height = 300,
}) => {
  const pieData = demanda.map((d) => ({
    name: d.nombre,
    value: d.numero,
  }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
