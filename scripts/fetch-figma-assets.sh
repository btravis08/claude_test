#!/usr/bin/env bash
# Downloads the SDR design imagery exported from Figma into public/figma/.
# Needs access to figma.com — run locally or via the fetch-figma-assets
# GitHub workflow. URLs are Figma MCP asset exports and expire ~7 days
# after generation; mint fresh ones via the Figma MCP if needed.
set -euo pipefail
cd "$(dirname "$0")/../public/figma"
mkdir -p _raw

fetch() {
  echo "→ $1"
  curl -fsSL -o "$1" "https://www.figma.com/api/mcp/asset/$2"
}

# Campaign photography (hero / full-width / 50-50) — raw fills
fetch campaign.png            747a12d2-e457-42bb-9ded-a7e3fa81435b
fetch _raw/campaign-b.png     c5d08e84-a8d7-42bd-9469-2a5c9e366bb1
fetch _raw/hero-export.png    aadf4332-4ad7-4a2a-8d1f-e2156002cceb

# Info card portrait media — raw fill candidates
fetch media-portrait.png      95166de2-cc84-4275-8f87-bcf851d7b104
fetch _raw/portrait-2.png     04e1a080-2dcc-49c3-a771-27de46585134
fetch _raw/portrait-3.png     18e957d6-ec7b-4fe2-807d-6512ebc46074
fetch _raw/portrait-4.png     fdeede87-cff1-4690-848d-6a9347dbdf5c
fetch _raw/portrait-5.png     a70f3e48-20c8-4ca9-b1bb-7e6da4d8b13b
fetch _raw/portrait-6.png     e7c029a5-def2-4577-b375-de5514dc10d4

# Product card shoe (image 44)
fetch card-shoe.png           9e4af51c-eeda-4d42-a8ce-0cebf279be05
fetch _raw/card-shoe-b.png    29e61e1c-52b1-4058-8d5b-89dcdbffc9bb

# Footer video band poster
fetch legacy-video.jpg        3233d562-c7af-4e68-9f08-c71d986c9bcf
fetch _raw/legacy-video-b.jpg 1be1c940-7221-4b97-8fe9-a787fa927045

# Union logo mark + footer swoosh (SVG, recolored via CSS mask)
fetch union.svg               5ec9c0e7-cb72-46e6-b15b-79064f48d179
fetch union-swoosh.svg        e6573cf0-3ff3-4fa2-ba22-1b41a0fef703

echo "Done."
