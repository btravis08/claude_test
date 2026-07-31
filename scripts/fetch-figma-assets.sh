#!/usr/bin/env bash
# Downloads the SDR design imagery exported from Figma into public/figma/.
# Needs access to figma.com — run locally or via the fetch-figma-assets
# GitHub workflow. URLs are Figma MCP asset exports and expire ~7 days
# after generation; mint fresh ones via the Figma MCP if needed.
#
# fetch() skips files that already exist in the repo, so stale URLs for
# already-committed assets never re-download (and never fail the run).
set -euo pipefail
cd "$(dirname "$0")/../public/figma"
mkdir -p _raw journal

fetch() {
  if [ -f "$1" ]; then
    echo "✓ $1 (exists, skipped)"
    return 0
  fi
  echo "→ $1"
  # tolerate expired URLs (assets already shipped in an earlier run)
  curl -fsSL -o "$1" "https://www.figma.com/api/mcp/asset/$2" || {
    echo "⚠ $1 failed (URL expired?)"
    rm -f "$1"
  }
}

# fetch + downscale/compress for shipped content imagery (≤300KB rule):
# resize to fit within $3 px and re-encode as jpeg via ImageMagick.
fetch_jpg() {
  if [ -f "$1" ]; then
    echo "✓ $1 (exists, skipped)"
    return 0
  fi
  echo "→ $1 (compressed)"
  curl -fsSL -o /tmp/figma-asset.tmp "https://www.figma.com/api/mcp/asset/$2" || {
    echo "⚠ $1 failed (URL expired?)"
    return 0
  }
  if command -v convert >/dev/null 2>&1; then
    convert /tmp/figma-asset.tmp -auto-orient -resize "${3:-1000}x${3:-1000}>" \
      -strip -interlace Plane -quality 78 "$1"
  else
    mv /tmp/figma-asset.tmp "$1"
  fi
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

# Honors Journal landing (Blog Landing Page V2, node 33996:98494) —
# HJ script monogram + the editorial image stream (node 33998:101705)
fetch journal/hj-monogram.svg 00e7e86b-01d4-45bf-bedb-aaf261e3cfd6
fetch_jpg journal/stream-01.jpg 84ad5973-79cb-4c64-bdc3-abd880848c19 1000
fetch_jpg journal/stream-02.jpg 02ebb35b-3c38-4e12-baa6-e8b57e04e8c2 1000
fetch_jpg journal/stream-03.jpg 75d97b19-68dd-4973-ad49-9719c5466cd7 1000
fetch_jpg journal/stream-04.jpg a82645cf-7b2c-4d57-bbc4-247b662c74bc 1000
fetch_jpg journal/stream-05.jpg 146d0abc-f609-4fc4-a197-d1518624c8a8 1000
fetch_jpg journal/stream-06.jpg 1804b1f9-cd7d-4288-ae60-906505863f5d 1000
fetch_jpg journal/stream-07.jpg d90950fe-79ac-46c0-9e91-dfc0cbffc3a3 1000
fetch_jpg journal/stream-08.jpg 677ea69f-4353-4048-ab4c-d0fb52004ceb 1000
fetch_jpg journal/stream-09.jpg 1d547a85-9ad6-4628-8bbf-f79069014011 1000
fetch_jpg journal/stream-10.jpg ef04270b-b8c3-4697-896c-96bd643690e9 1000
fetch_jpg journal/stream-11.jpg 2e98757c-7b3e-47e9-b497-9d6449ca511e 1000
fetch_jpg journal/stream-12.jpg a46187f8-eff7-4141-a91e-03bf6cef78cb 1000
fetch_jpg journal/stream-13.jpg 2a34432d-2e0f-4838-88e8-ded3db6a050e 1000
fetch_jpg journal/stream-14.jpg 5cc06b41-b953-4ee1-8a54-0e8549d54055 1000
fetch_jpg journal/stream-15.jpg 3ab4abee-7d3b-40d1-991d-8367c6698bf5 1000
fetch_jpg journal/stream-16.jpg fb3c21b6-79c8-4901-b638-65e671b3cbc0 1000

echo "Done."

# Footer "SUN DAY RED" word marks (Figma 33981:107495/107496/107501,
# exported as SVGs — rendered via CSS mask so they take the ink color)
fetch sdr-word-sun.svg 2886f4a9-a41b-40c0-8fcb-0388db2a8637
fetch sdr-word-day.svg 9c216349-634b-4887-8838-48a825e6743c
fetch sdr-word-red.svg 54958702-e814-42e4-9cba-970c70313403

# Legacy page (node 33599:69683) — hero campaign, floating images,
# embossed tiger mark, info-card imagery, and the product-swirl planes
# (pre-skewed PNG exports; mirrored copies are flipped in CSS).
mkdir -p legacy
fetch_jpg legacy/hero.jpg          d43ed65a-8242-4067-830a-a6191cbebab6 2200
fetch_jpg legacy/float-putt.jpg    5670f4f5-183f-4a7c-a512-eceb5dee9147 1000
fetch_jpg legacy/float-crowd.jpg   6a1fb2d2-5f87-4d5e-a236-8fa8e8047256 1200
fetch_jpg legacy/float-shoes.jpg   1d71d7c2-34db-41af-b780-63548b206c0f 1200
fetch legacy/mark-emboss.svg       712727e2-5df6-4963-9d82-fb1f8e90a85b
fetch_jpg legacy/info-precision.jpg   9a28af72-3e82-4a7b-9ff8-07336493ef94 1000
fetch_jpg legacy/info-performance.jpg bdd27563-52a5-4313-bdc2-c7f9a627c10d 1000
fetch_jpg legacy/info-quality.jpg     d34b5794-0161-46ee-9da5-8689ece28897 1000
fetch_jpg legacy/info-comfort.jpg     4121f710-9911-4344-88b4-07f5b36c9b64 1000
fetch_jpg legacy/info-tech.jpg        294f9af0-278d-470f-8165-2ab5e72d8f96 800

# Product swirl planes are skewed vectors whose image fills don't
# export — these are rendered node screenshots (contents-only PNGs).
fetch legacy/swirl-arc-low.png  309f7dc7-ac2f-46b1-bc4c-f1fa2e504c3f
fetch legacy/swirl-arc-high.png bcd51aeb-7420-48f9-9ab5-7a11d8e6bd88
fetch legacy/swirl-sliver-r.png 8de6e748-e3b8-4023-bf1c-3f7188746244
fetch legacy/swirl-table.png    4475d916-6119-4b13-a746-477d68d109c8
fetch legacy/swirl-sliver-l.png f59ebd2a-e8fe-4859-aa81-cfdba3d4c526
fetch legacy/swirl-hoodie.png   0469ada9-8076-49cf-adcb-b8bae72141f3

# ---------------------------------------------------------------
# Design comps for /library's compare mode: a flat render of each
# section's Figma frame, overlaid on the live component to diff the
# build against the design. Rendered node screenshots at frame width,
# compressed hard (reference imagery, never shipped to a page).
mkdir -p comps
fetch_jpg comps/legacy-hero.jpg          8671e87f-fc32-4399-93aa-90ec47a4f79b 1440
fetch_jpg comps/split-text.jpg           89a81617-d317-46f1-bd46-267506b0ce5d 1440
fetch_jpg comps/full-bleed-carousel.jpg  49e78294-00dc-4c17-a207-e8daefb29ce5 1440
fetch_jpg comps/product-swirl.jpg        4a726442-a45b-47ae-8f2a-b06bcf1f4444 1440
fetch_jpg comps/floating-gallery.jpg     c36a0870-9ef3-4f68-a865-2a81629ff929 1440
fetch_jpg comps/tech-specs.jpg           c89d37b8-4b7a-4ac7-a057-68351e3260c7 1440
