export function parseCsv(raw: Uint8Array): Record<string, string>[] {
  const lines = new TextDecoder()
    .decode(raw).split('\n').map(l => l.trim()).filter(Boolean);
  const headers = splitLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = splitLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });
}

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === ',' && !inQ) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function shrinkCsv(csvUint8: Uint8Array, keepColumns: string[]): Uint8Array {
  const text = new TextDecoder().decode(csvUint8);
  const lines = text.split('\n');
  if (lines.length === 0) return new Uint8Array();

  const header = lines[0].split(',');
  const indices = keepColumns.map(col => header.indexOf(col)).filter(i => i !== -1);
  
  const result = lines.map(line => {
    const parts = line.split(',');
    return indices.map(i => parts[i]).join(',');
  }).join('\n');

  return new TextEncoder().encode(result);
}

export function parseCsv2(raw: Uint8Array): Record<string, string>[] {
  const text = new TextDecoder().decode(raw);
  const lines = text.split('\n');
  if (lines.length < 2) return [];

  // Pobieramy nagłówki i czyścimy je raz
  const headers = splitLine2(lines[0]);
  const headerLen = headers.length;
  const result: Record<string, string>[] = [];

  // Używamy klasycznej pętli for - jest najszybsza w V8
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;

    const vals = splitLine2(line);
    const obj: Record<string, string> = {};
    
    // Ręczne budowanie obiektu zamiast Object.fromEntries
    for (let j = 0; j < headerLen; j++) {
      obj[headers[j]] = vals[j] || '';
    }
    result.push(obj);
  }

  return result;
}

/**
 * Super szybki spliter uwzględniający cudzysłowy.
 * Zamiast iterować znak po znaku, szukamy przecinków.
 */
function splitLine2(line: string): string[] {
  // Jeśli w linii nie ma cudzysłowu (99% przypadków w stop_times.txt),
  // używamy natywnego split - jest bezkonkurencyjnie najszybszy.
  if (line.indexOf('"') === -1) {
    return line.split(',');
  }

  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      // Szukamy domykającego cudzysłowu
      const endQuote = line.indexOf('"', i + 1);
      if (endQuote === -1) {
        out.push(line.slice(i + 1).trim());
        break;
      }
      out.push(line.slice(i + 1, endQuote).trim());
      i = line.indexOf(',', endQuote + 1);
      if (i === -1) break;
      i++; // pomiń przecinek
    } else {
      const nextComma = line.indexOf(',', i);
      if (nextComma === -1) {
        out.push(line.slice(i).trim());
        break;
      }
      out.push(line.slice(i, nextComma).trim());
      i = nextComma + 1;
    }
  }
  return out;
}