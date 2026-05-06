import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ChatIaBlockPieChart } from "../../core/chatIaTypes";

const COLORS = ["#1f6feb", "#176b87", "#2f855a", "#d97706", "#b91c1c", "#6b7280"];

type PieChartProps = {
  block: ChatIaBlockPieChart;
};

export default function PieChart({ block }: PieChartProps) {
  return (
    <section className="chat-ia-viz-block chat-ia-viz-pie-chart">
      <h3>{block.title}</h3>
      <div className="chat-ia-viz-chart">
        <ResponsiveContainer width="100%" height={220}>
          <RechartsPieChart>
            <Pie data={block.data} dataKey="value" nameKey="label" outerRadius={84} label>
              {block.data.map((entry, index) => (
                <Cell fill={COLORS[index % COLORS.length]} key={`${entry.label}-${index}`} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
