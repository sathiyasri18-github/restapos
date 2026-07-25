#!/usr/bin/env bash
# Run on the Ubuntu host that serves 194.163.139.218
# Usage: sudo bash scripts/fix-caddy-muru.sh

set -euo pipefail

CADDYFILE="${CADDYFILE:-/etc/caddy/Caddyfile}"
EXAMPLE="$(cd "$(dirname "$0")/.." && pwd)/Caddyfile.muruenterprises.example"

echo "== Ports =="
ss -tlnp | grep -E ':80|:443' || true

echo "== Caddy status =="
systemctl is-active caddy || true

echo "== Site blocks present? =="
if grep -q 'muruenterprises.info' "$CADDYFILE"; then
  echo "Found muruenterprises.info in $CADDYFILE"
else
  echo "MISSING â€” appending from $EXAMPLE"
  if [[ -f "$EXAMPLE" ]]; then
    # Append only the site blocks (skip comment header lines that are docs-only is fine)
    cat "$EXAMPLE" >> "$CADDYFILE"
  else
    echo "Example file not found at $EXAMPLE â€” paste site blocks manually."
    exit 1
  fi
fi

echo "== Validate =="
caddy validate --config "$CADDYFILE"

echo "== Restart Caddy (retries ACME certs) =="
systemctl restart caddy
sleep 3

echo "== Recent cert / ACME log lines =="
journalctl -u caddy -n 120 --no-pager | grep -iE 'muru|certificate|acme|error|tls' || true

echo "== Local HTTP check =="
curl -sI -H 'Host: muruenterprises.info' http://127.0.0.1/ | head -n 5 || true

echo
echo "From your PC, retest:  curl -vI https://muruenterprises.info"
echo "If TLS still fails, read the journal lines above for ACME errors."
