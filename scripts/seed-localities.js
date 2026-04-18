const fs = require('fs');
const path = require('path');

function quoteText(value) {
  if (value === undefined || value === null || value === '') return 'null';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function quoteArray(value) {
  if (!Array.isArray(value)) return 'null';
  if (value.length === 0) return 'ARRAY[]::text[]';
  const items = value.map((item) => `'${String(item).replace(/'/g, "''")}'`);
  return `ARRAY[${items.join(', ')}]`;
}

function quoteDescription(value) {
  if (value === undefined || value === null || value === '') return 'null';
  const normalized = String(value).replace(/\$jc\$/g, '$ j c $');
  return `$jc$${normalized}$jc$`;
}

function quoteNumeric(value) {
  if (value === undefined || value === null || value === '') return 'null';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 'null';
  return String(numeric);
}

function buildInsert(row) {
  return `insert into public.localities (
  name,
  slug,
  zone,
  locality_type,
  ward_number,
  ward_name,
  pin_codes,
  assembly_constituency,
  police_station,
  description,
  character_tags,
  event_relevance,
  notable_landmarks,
  micro_localities,
  nearby_localities,
  geo_lat,
  geo_lng
) values (
  ${quoteText(row.name)},
  ${quoteText(row.slug)},
  ${quoteText(row.zone)},
  ${quoteText(row.locality_type)},
  ${quoteText(row.ward_number)},
  ${quoteText(row.ward_name)},
  ${quoteArray(row.pin_codes)},
  ${quoteText(row.assembly_constituency)},
  ${quoteText(row.police_station)},
  ${quoteDescription(row.description)},
  ${quoteArray(row.character_tags)},
  ${quoteText(row.event_relevance)},
  ${quoteArray(row.notable_landmarks)},
  ${quoteArray(row.micro_localities)},
  ${quoteArray(row.nearby_localities)},
  ${quoteNumeric(row.geo_lat)},
  ${quoteNumeric(row.geo_lng)}
)
on conflict (slug) do update set
  name = excluded.name,
  zone = excluded.zone,
  locality_type = excluded.locality_type,
  ward_number = excluded.ward_number,
  ward_name = excluded.ward_name,
  pin_codes = excluded.pin_codes,
  assembly_constituency = excluded.assembly_constituency,
  police_station = excluded.police_station,
  description = excluded.description,
  character_tags = excluded.character_tags,
  event_relevance = excluded.event_relevance,
  notable_landmarks = excluded.notable_landmarks,
  micro_localities = excluded.micro_localities,
  nearby_localities = excluded.nearby_localities,
  geo_lat = excluded.geo_lat,
  geo_lng = excluded.geo_lng;`;
}

function main() {
  const sourcePath = path.resolve(process.cwd(), 'localities.json');

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing localities.json at ${sourcePath}`);
  }

  const raw = fs.readFileSync(sourcePath, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    throw new Error('localities.json must be an array');
  }

  const lines = ['begin;'];
  for (const row of data) {
    lines.push(buildInsert(row));
  }
  lines.push('commit;');

  process.stdout.write(lines.join('\n\n') + '\n');
}

main();

