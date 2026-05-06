import type { ChatIaOutputBlock } from "../../core/chatIaTypes";
import BarChartCompare from "./BarChartCompare";
import CalloutBox from "./CalloutBox";
import ComparisonSplit from "./ComparisonSplit";
import DataTableStyled from "./DataTableStyled";
import MetricCardGrid from "./MetricCardGrid";
import MixedLayout from "./MixedLayout";
import NestedList from "./NestedList";
import PieChart from "./PieChart";
import RankingTable from "./RankingTable";
import SummaryCardBig from "./SummaryCardBig";
import Timeline from "./Timeline";
import TrendChartLine from "./TrendChartLine";
import "./chatIaVisualizationBlocks.css";

type ChatIaVisualizationBlocksProps = {
  blocks: ChatIaOutputBlock[];
};

export default function ChatIaVisualizationBlocks({ blocks }: ChatIaVisualizationBlocksProps) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.kind === "summary_card_big") return <SummaryCardBig block={block} key={`${block.kind}-${index}`} />;
        if (block.kind === "metric_card_grid") return <MetricCardGrid block={block} key={`${block.kind}-${index}`} />;
        if (block.kind === "comparison_split") return <ComparisonSplit block={block} key={`${block.kind}-${index}`} />;
        if (block.kind === "ranking_table") return <RankingTable block={block} key={`${block.kind}-${index}`} />;
        if (block.kind === "trend_chart_line") return <TrendChartLine block={block} key={`${block.kind}-${index}`} />;
        if (block.kind === "bar_chart_compare") return <BarChartCompare block={block} key={`${block.kind}-${index}`} />;
        if (block.kind === "pie_chart") return <PieChart block={block} key={`${block.kind}-${index}`} />;
        if (block.kind === "timeline") return <Timeline block={block} key={`${block.kind}-${index}`} />;
        if (block.kind === "data_table_styled") return <DataTableStyled block={block} key={`${block.kind}-${index}`} />;
        if (block.kind === "callout") return <CalloutBox block={block} key={`${block.kind}-${index}`} />;
        if (block.kind === "mixed_layout") return <MixedLayout block={block} key={`${block.kind}-${index}`} />;
        if (block.kind === "nested_list") return <NestedList block={block} key={`${block.kind}-${index}`} />;
        return null;
      })}
    </>
  );
}
