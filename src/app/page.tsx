import PanelSection from "@/components/layout/PanelSection";
import AnnualReturnsBar from "@/components/charts/AnnualReturnsBar";
import ReturnDistributionChart from "@/components/charts/ReturnDistributionChart";
import AnnualizedMatrixChart from "@/components/charts/AnnualizedMatrixChart";
import RollingReturnsChart from "@/components/charts/RollingReturnsChart";
import LogYoYChart from "@/components/charts/LogYoYChart";
import DrawdownChart from "@/components/charts/DrawdownChart";
import IntrayearDDChart from "@/components/charts/IntrayearDDChart";
import VolatilityChart from "@/components/charts/VolatilityChart";
import RealizedVolChart from "@/components/charts/RealizedVolChart";
import MonthlyHeatmapChart from "@/components/charts/MonthlyHeatmapChart";
import ValuationAreaChart from "@/components/charts/ValuationAreaChart";
import StockBondRatioChart from "@/components/charts/StockBondRatioChart";
import IndexComparisonChart from "@/components/charts/IndexComparisonChart";
import A7IndexChart from "@/components/charts/A7IndexChart";
import IndustryTreemapChart from "@/components/charts/IndustryTreemapChart";
import ConstituentScatterChart from "@/components/charts/ConstituentScatterChart";
import IndexChangelogTable from "@/components/charts/IndexChangelogTable";
import IndexRulesInfo from "@/components/charts/IndexRulesInfo";
import HSTechChart from "@/components/charts/HSTechChart";
import HSIvsHS300Chart from "@/components/charts/HSIvsHS300Chart";
import NorthboundFlowChart from "@/components/charts/NorthboundFlowChart";
import AHPremiumChart from "@/components/charts/AHPremiumChart";
import ChinaVsSP500Chart from "@/components/charts/ChinaVsSP500Chart";
import IPORhythmChart from "@/components/charts/IPORhythmChart";
import PolicyTimelineChart from "@/components/charts/PolicyTimelineChart";
import MarginBalanceChart from "@/components/charts/MarginBalanceChart";
import ReturnDecompPanel from "@/components/panels/ReturnDecompPanel";
import BondEquityPanel from "@/components/panels/BondEquityPanel";
import CommoditiesPanel from "@/components/panels/CommoditiesPanel";
import NorthboundPanel from "@/components/panels/NorthboundPanel";
import SectorHeatmapPanel from "@/components/panels/SectorHeatmapPanel";
import PanelSearch from "@/components/ui/PanelSearch";
import { HOME_SECTIONS, type HomePanelDef } from "@/lib/homePanels";

function SectionTitle({ cn, en }: { cn: string; en: string }) {
  return (
    <div className="section-title">
      <h1>{cn}</h1>
      <p>{en}</p>
    </div>
  );
}

function renderChart(panel: HomePanelDef) {
  const { chart } = panel;

  switch (chart.type) {
    case "annualReturns":
      return <AnnualReturnsBar indexSlug={chart.indexSlug} />;
    case "returnDistribution":
      return <ReturnDistributionChart indexSlug={chart.indexSlug} />;
    case "annualizedMatrix":
      return <AnnualizedMatrixChart indexSlug={chart.indexSlug} />;
    case "rollingReturns":
      return <RollingReturnsChart indexSlug={chart.indexSlug} />;
    case "logYoy":
      return <LogYoYChart indexSlug={chart.indexSlug} />;
    case "drawdown":
      return <DrawdownChart indexSlug={chart.indexSlug} />;
    case "intrayearDd":
      return <IntrayearDDChart indexSlug={chart.indexSlug} />;
    case "volatility":
      return <VolatilityChart indexSlug={chart.indexSlug} />;
    case "realizedVol":
      return <RealizedVolChart indexSlug={chart.indexSlug} />;
    case "monthlyHeatmap":
      return <MonthlyHeatmapChart indexSlug={chart.indexSlug} />;
    case "valuationArea":
      return (
        <ValuationAreaChart
          indexSlug={chart.indexSlug}
          filename={chart.filename}
          fieldKey={chart.fieldKey}
          label={chart.label}
          colorUp={chart.colorUp}
        />
      );
    case "stockBondRatio":
      return <StockBondRatioChart />;
    case "bondEquity":
      return <BondEquityPanel />;
    case "indexComparison":
      return <IndexComparisonChart />;
    case "a7Index":
      return <A7IndexChart />;
    case "industryTreemap":
      return <IndustryTreemapChart />;
    case "constituentScatter":
      return <ConstituentScatterChart />;
    case "indexChangelog":
      return <IndexChangelogTable />;
    case "indexRules":
      return <IndexRulesInfo />;
    case "hsTech":
      return <HSTechChart />;
    case "hsiVsHs300":
      return <HSIvsHS300Chart />;
    case "northboundFlow":
      return <NorthboundFlowChart />;
    case "northbound":
      return <NorthboundPanel />;
    case "sectorHeatmap":
      return <SectorHeatmapPanel />;
    case "ahPremium":
      return <AHPremiumChart />;
    case "chinaVsSp500":
      return <ChinaVsSP500Chart />;
    case "ipoRhythm":
      return <IPORhythmChart />;
    case "policyTimeline":
      return <PolicyTimelineChart />;
    case "marginBalance":
      return <MarginBalanceChart />;
    case "returnDecomp":
      return <ReturnDecompPanel />;
    case "commodities":
      return <CommoditiesPanel />;
  }
}

export default function Home() {
  return (
    <div>
      <PanelSearch />

      <div className="home-sections">
        {HOME_SECTIONS.map((section) => (
          <div key={section.sectionId}>
            <SectionTitle cn={`§ ${section.index} ${section.titleCn}`} en={section.titleEn} />

            {section.panels.map((panel) => (
              <PanelSection
                key={panel.id}
                id={panel.id}
                panelId={panel.panelId}
                titleCn={panel.titleCn}
                titleEn={panel.titleEn}
                source={panel.source}
              >
                {renderChart(panel)}
              </PanelSection>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
