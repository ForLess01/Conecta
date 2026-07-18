export interface CsvPriceRow {
  product_code: string;
  variety_code?: string;
  market_name?: string;
  observed_on: string;
  price_low?: string;
  price_mid: string;
  price_high?: string;
  source_code: string;
  unit_code: string;
  currency_code: string;
  source_url?: string;
}

export function parsePriceCsv(csv: string): CsvPriceRow[] {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("CSV must include a header and at least one row.");
  const headers = parseCsvLine(lines[0]).map((value) => value.trim().toLowerCase());
  const required = ["product_code", "observed_on", "price_mid", "source_code", "unit_code", "currency_code"];
  if (required.some((header) => !headers.includes(header))) throw new Error("CSV is missing required columns.");
  return lines.slice(1).map((line, rowIndex) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) throw new Error(`CSV row ${rowIndex + 2} has an invalid column count.`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index].trim()])) as unknown as CsvPriceRow;
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) {
      result.push(value); value = "";
    } else value += character;
  }
  if (quoted) throw new Error("CSV contains an unterminated quoted value.");
  result.push(value);
  return result;
}
