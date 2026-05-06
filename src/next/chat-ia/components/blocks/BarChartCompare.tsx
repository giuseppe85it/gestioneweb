import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChatIaBlockBarChartCompare } from "../../core/chatIaTypes";

type BarChartCompareProps = {
  block: ChatIaBlockBarChartCompare;
};

export default function BarChartCompare({ block }: BarChartCompareProps) {
  return (
    <section className="chat-ia-viz-block chat-ia-viz-bar-chart-compare">
      <h3>{block.title}</h3>
      <div className="chat-ia-viz-chart">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={block.data}>
            <CartesianGrid stroke="#e4e9ed" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#176b87" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="chat-ia-viz-muted">{block.valueLabel}</p>
    </section>
  );
}
