#!/usr/bin/env bash
set -euo pipefail

INPUT="${1:-urls.txt}"
OUTPUT="${2:-url_audit.csv}"

if [[ ! -f "$INPUT" ]]; then
  echo "Missing input file: $INPUT"
  exit 1
fi

echo 'url,http_code,final_url' > "$OUTPUT"

while IFS= read -r url || [[ -n "$url" ]]; do
  [[ -z "$url" ]] && continue
  clean_url="$(printf '%s' "$url" | sed 's/^"//; s/"$//')"

  result="$(curl -sS -L -I -o /dev/null -w '%{http_code},%{url_effective}' "$clean_url" || echo '000,ERROR')"
  code="${result%%,*}"
  final="${result#*,}"

  esc_url="${clean_url//\"/\"\"}"
  esc_final="${final//\"/\"\"}"

  echo "\"$esc_url\",\"$code\",\"$esc_final\"" >> "$OUTPUT"
done < "$INPUT"

echo
echo "Saved audit to: $OUTPUT"
echo "Summary:"
cut -d',' -f2 "$OUTPUT" | tail -n +2 | sort | uniq -c | sort -nr
