# 道瓊三萬點：歷史互動圖表

Private Site: `appgprj_6ab7ca1590e4819193eaaab74de71ebc` / `dow-cycle-atlas`.

A static Traditional Chinese data explorer based on the user's supplied 282-page PDF. The book itself is not tracked; 127 referenced page images are included for private comparison. Do not make the Site public without user authorization.

## Coverage and provenance

- `dist/data/catalog.json`: 105 deduplicated chart topics, 67 connected and 38 pending. Some connected topics use explicitly labelled alternative definitions. This is not an assertion of complete chart-for-chart reproduction.
- `dist/data/history.json`: successfully downloaded FRED and World Bank observations; original provider URLs, data dates and fetch timestamps are retained. All history uses current revisions, not vintage/as-of data.
- `series.json`: series definitions and units, with title checks in `metadata-check.json`.
- `catalog.py`: editable chart registry, PDF page references, limitations, pending work.
- `dist/book/`: original PDF page images, numbered by file page, not print page. Some figures use multiple book pages, and multiple figures may share one page.

Do not invent missing data or substitute a new meaning under an old label. Author-created GDP investment indicator is pending because this book refers to a formula in another book. Historical forecasts must remain distinct from observed data. Dow and S&P history and licensed home-sales/high-yield series may have limited provider windows.

## Update

Run `python3 update_data.py` from the repository. It requests full history for used series, keeps the last good data and marks failures. `--only-missing` is repair-only and MUST NOT be used for scheduled refresh. Metadata is retained in `series.json`; any provider definition/unit changes require review. Run `python3 catalog.py` only after editing chart definitions. `prepare.py` regenerates initial series definitions and preserves Site identity, but is not needed for routine updates.

Before publishing, check finite values, sorted/unique dates, actual start/end dates, units and source title matches. Run `node --check dist/app.js` and `node --check dist/math.js`; use Sites hosting workflow to push and publish the same private Site. The output is plain static `dist/`.

## Interaction

Category/search, 5/10/20-year/all/book-era windows, custom dates, original values/year-over-year/indexed transformations, dual axes for at most two distinct units, line visibility, pointer/touch observations, CSV download, data table, source links and original book pages. Ratio calculations align exact dates. Indexing uses each series's first available point in the selected interval and requires a positive baseline. Not all series share a base date. Dates displayed with monthly/quarterly observations are period markers, not publication dates.

## Schedule status

On 2026-09-26 the attempt to create a daily refresh at about 08:00 Asia/Taipei failed: `too_many_active_automations`, active 5/5. No existing task was modified. Website correctly states automatic scheduling is not active. Ask the user which existing task to pause or replace, then create the refresh task and update the website's schedule note only after success.

The proposed task opens this exact Site using Sites tools, restores its repo if needed, runs `python3 update_data.py`, validates and republishes privately, reports changed observations, revisions and failures. Do not replace the historical dataset with a text-only news summary. Site read-only access was verified before attempting scheduling.

## Validation limits

Data transformation checks and JavaScript syntax checks performed. No permitted browser preview context is available for this static project. Optional WebMCP registration is feature-detected; a supported WebMCP runtime was unavailable for validation.
