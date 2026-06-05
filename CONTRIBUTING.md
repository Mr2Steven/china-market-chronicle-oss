# Contributing

Thanks for your interest in China Market Chronicle.

This project welcomes focused contributions that improve reliability, data transparency, chart quality, and maintainability.

## Development Setup

Install frontend dependencies:

```bash
npm install
```

Run the local app:

```bash
npm run dev
```

Run lint checks before opening a pull request:

```bash
npm run lint
```

Install pipeline dependencies:

```bash
python3 -m pip install -r pipeline/requirements.txt
```

Run the full data refresh:

```bash
python3 pipeline/run_all.py
```

## Pull Request Guidelines

- Keep pull requests focused on one change or closely related set of changes.
- Explain the user-facing impact and any data-source assumptions.
- Include screenshots for visual changes when useful.
- Avoid committing local caches, environment files, raw downloads, or generated build output.
- If a change updates generated `public/api/` data, mention which pipeline command produced it.

## Data Quality

Market data sources can change without warning. When editing pipeline code, prefer changes that make failures explicit and easy to diagnose.

Useful improvements include:

- Shape validation for generated JSON files.
- Clear source notes and timestamp metadata.
- Graceful fallbacks when a non-core source is temporarily unavailable.
- Small fixtures or tests for transform logic where practical.

## Code Style

The frontend is a Next.js App Router application using TypeScript, React, Tailwind CSS, and ECharts. Follow the existing component and panel patterns before adding new abstractions.

The Python pipeline favors simple scripts with explicit output paths and readable transform steps.

## Security

Do not include credentials, private datasets, browser cookies, API keys, or personal access tokens in issues, commits, or pull requests.
