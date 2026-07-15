#!/usr/bin/env bash
# Downloads the SDR design imagery exported from Figma into public/figma/.
# Run this once from a machine with access to figma.com (the URLs are
# Figma MCP asset exports and expire ~7 days after generation; re-run
# get_design_context on the homepage node to mint fresh ones if needed).
set -euo pipefail
cd "$(dirname "$0")/../public/figma"

fetch() {
  echo "→ $1"
  curl -fsSL -o "$1" "https://www.figma.com/api/mcp/asset/$2"
}

# Campaign photography (Rectangle 425 — hero / full-width / 50-50)
fetch campaign.png        3e40d6a5-ab1d-4de2-a883-1ca2c69db437
# Portrait media (info cards / carousel)
fetch media-portrait.png  aa09a039-eddd-4fca-9577-047d6f039586
# Product card shoe (image 44)
fetch card-shoe.png       a7e0698c-f127-4398-9246-dcceb2983a92
# Footer video band poster
fetch legacy-video.png    05d35362-093e-4deb-b11a-0a80c0af9ad2
# Union logo mark (used as CSS mask, recolored via currentColor)
fetch union.png           d21f782c-f449-4946-b0b5-6d30edd0f986
# Swoosh vector in the footer wordmark
fetch union-swoosh.png    a93ded55-c85f-479a-afec-cad728ba3837

echo "Done. Commit public/figma/ so the assets ship with the site."
