#!/usr/bin/env bash
# Stops a running load test from another terminal (same as Ctrl+C in its own)
curl -sS -X PATCH localhost:6565/v1/status -H 'Content-Type: application/json' \
  -d '{"data":{"type":"status","id":"default","attributes":{"stopped":true}}}'
echo
