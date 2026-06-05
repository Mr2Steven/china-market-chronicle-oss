# China Market Chronicle

China Market Chronicle is an open-source market data dashboard for exploring long-term Chinese equity-market history. It combines a Next.js visual interface with a Python data pipeline that refreshes index, valuation, flow, drawdown, return, IPO, commodity, margin, and sector datasets into static JSON APIs.

The project is designed for investors, researchers, writers, and builders who want a transparent, reproducible way to study Chinese market cycles without stitching together one-off spreadsheets.

> This project is for research and education only. It is not investment advice.

## Highlights

- Bilingual market interface with Chinese-market-specific chart conventions.
- Static JSON API outputs under `public/api/` for easy inspection and reuse.
- Automated data refresh workflow through GitHub Actions.
- Python pipeline for fetching and transforming public market datasets.
- Next.js App Router frontend with ECharts visualizations.
- SEO-ready panel pages, sitemap, robots, and LLM-readable routes.

## What It Tracks

- Broad-market index performance for A-share, Hong Kong, and S&P 500 comparisons.
- Annual, monthly, rolling, volatility, drawdown, and intrayear drawdown views.
- Valuation series such as PE and PB where source data is available.
- Northbound flow, margin balance, IPO rhythm, commodity, bond-equity, and return decomposition panels.
- CSI 300 constituents, industry weights, and sector heatmap data.
- Policy and market-event context for historical interpretation.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- ECharts
- Python data pipeline
- GitHub Actions scheduled refresh

## Getting Started

Install frontend dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

Build the app:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

## Data Pipeline

Install Python dependencies:

```bash
python3 -m pip install -r pipeline/requirements.txt
```

Refresh all generated market datasets:

```bash
python3 pipeline/run_all.py
```

Generated JSON files are written to `public/api/`. The repository includes these outputs so the frontend can run without requiring every contributor to fetch market data locally.

## Repository Structure

```text
src/app/                Next.js routes, metadata, sitemap, robots, OG images
src/components/         Layout, panels, UI elements, and chart components
src/lib/                Panel registry, SEO helpers, constants, data utilities
pipeline/               Python market-data fetch and transform scripts
public/api/             Generated static JSON datasets consumed by the app
docs/                   Product and design notes
```

## Data Sources

The pipeline uses public market data sources through Python libraries and HTTP endpoints, including AkShare-supported datasets and public exchange/data-provider endpoints. Availability and historical coverage vary by dataset.

If a source changes shape, rate limits, or becomes unavailable, the relevant pipeline script may need maintenance. Contributions that improve source resilience, data provenance, and validation are welcome.

## Contributing

Issues and pull requests are welcome. Good contribution areas include:

- Fixing data-fetch failures caused by upstream source changes.
- Adding validation for generated JSON shapes.
- Improving chart readability and mobile responsiveness.
- Extending documentation for pipeline behavior and data provenance.
- Adding tests for data transforms and derived metrics.

See [CONTRIBUTING.md](CONTRIBUTING.md) for contributor guidance.

## License

Released under the [MIT License](LICENSE).
