import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChatIaBlockTrendChartLine } from "../../core/chatIaTypes";

type TrendChartLineProps = {
  block: ChatIaBlockTrendChartLine;
};

export default function TrendChartLine({ block }: TrendChartLineProps) {
  return (
    <section className="chat-ia-viz-block chat-ia-viz-trend-chart-line">
      <h3>{block.title}</h3>
      <div className="chat-ia-viz-chart">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={block.data}>
            <CartesianGrid stroke="#e4e9ed" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#1f6feb" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="chat-ia-viz-muted">{block.valueLabel}</p>
    </section>
  );
}
