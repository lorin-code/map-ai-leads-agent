#!/usr/bin/env node

const {
  fetchAllPois,
  parseArgs,
  writeOutputs,
} = require('../integrations/amapClient');

function usage() {
  return `Usage:
  AMAP_KEY=your_key node server/bin/amap-leads.js --city 上海 --keywords 钢琴 --json data_amap.json --csv leads.csv

Options:
  --key <key>          AMap Web service key. Defaults to AMAP_KEY.
  --city <city>        City name or adcode, for example 上海 or 310115.
  --keywords <text>    Search keyword, for example 钢琴.
  --types <code>       Optional AMap type code, for example 141400.
  --json <path>        Raw JSON output path. Defaults to data_amap.json.
  --csv <path>         Optional normalized CSV output path.
  --offset <number>    Page size. Defaults to 20.
  --max-pages <number> Max pages to fetch. Defaults to 10.
  --delay-ms <number>  Delay between page requests. Defaults to 500.
`;
}

async function main() {
  const options = parseArgs();
  if (options.help) {
    process.stdout.write(usage());
    return;
  }

  const result = await fetchAllPois(options);
  await writeOutputs({
    pois: result.pois,
    jsonPath: options.json,
    csvPath: options.csv,
  });

  process.stdout.write(
    [
      `Fetched ${result.pois.length} POIs from ${result.pagesFetched} page(s).`,
      `AMap reported total: ${result.total}.`,
      options.json ? `JSON: ${options.json}` : null,
      options.csv ? `CSV: ${options.csv}` : null,
    ]
      .filter(Boolean)
      .join('\n')
  );
  process.stdout.write('\n');
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n\n${usage()}`);
  process.exitCode = 1;
});
