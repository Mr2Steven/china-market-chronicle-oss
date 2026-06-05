# Data Pipeline

This directory contains the data refresh pipeline for China Market Chronicle.
The pipeline writes frontend-ready JSON files to `public/api/`.

## Install

```bash
python3 -m pip install -r pipeline/requirements.txt
```

## Run

```bash
python3 pipeline/run_all.py
```

`run_all.py` executes these steps:

1. `fetch_index_daily.py` fetches A-share and Hong Kong index daily data to `pipeline/raw/`.
2. `compute_derived.py` calculates annual returns, drawdowns, rolling 5-year CAGR, intrayear drawdowns, monthly returns, slim daily series, and `_manifest.json`.
3. `fetch_valuation.py` fetches A-share PE/PB valuation series.
4. `fetch_extras.py` fetches northbound flow, HS300 constituents, and the HSAHP A/H premium index.
5. `fetch_constituents_detail.py` enriches HS300 constituents with industry, market cap, and YTD return.
6. `fetch_a7.py` fetches the A-share 7 giants and builds an equal-weight index.
7. `fetch_ipo.py` fetches IPO detail and monthly IPO counts.
8. `fetch_sp500.py` fetches S&P 500 daily closes.

## Outputs

- `public/api/{index}/daily.json`: `[{date, close}]`
- `public/api/{index}/annual-returns.json`: `[{year, return_pct, close}]`
- `public/api/{index}/drawdowns.json`: `{daily_drawdown, named_events}`
- `public/api/{index}/rolling-5y.json`: `[{date, cagr_5y}]`
- `public/api/{index}/intrayear-dd.json`: `[{year, full_year_return, max_intrayear_dd}]`
- `public/api/{index}/monthly.json`: `{matrix, summary}`
- `public/api/{index}/pe.json`: `[{date, pe}]`
- `public/api/{index}/pb.json`: `[{date, pb}]`
- `public/api/northbound/flow.json`: `[{date, net_flow, cumulative}]`
- `public/api/ah-premium/index.json`: `[{date, premium}]`
- `public/api/ipo/detail.json`: `[{code, name, date, price, amount}]`
- `public/api/ipo/monthly.json`: `[{month, count, amount}]`
- `public/api/sp500/daily.json`: `[{date, close}]`

## Data Sources

- AkShare / East Money: A-share indices, Hong Kong indices, northbound flow, HS300 constituents, A-share spot data, industry boards, IPO data.
- AkShare / Legulegu: A-share PE/PB valuation series.
- Sina Finance fallback: selected A-share index and stock daily series.
- HSAHP: Hang Seng Stock Connect AH Premium Index via AkShare Hong Kong index endpoint.

## Scheduled Refresh

The repository includes a GitHub Actions workflow at
`.github/workflows/refresh-data.yml`. It runs on weekdays and can also be
started manually through `workflow_dispatch`.

The workflow installs Python dependencies, runs `pipeline/run_all.py`, and
commits changed files under `public/api/`.

If you run a private fork with network constraints, configure any required
proxy or mirror settings in your own environment rather than committing local
machine settings to the repository.

## Notes

Network and upstream data-source failures are expected occasionally. The IPO
and S&P 500 scripts keep existing JSON files when all upstream attempts fail,
so a partial upstream outage does not delete previously usable data.
