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
fetch legacy/mark-emboss.png       712727e2-5df6-4963-9d82-fb1f8e90a85b
fetch_jpg legacy/info-precision.jpg   9a28af72-3e82-4a7b-9ff8-07336493ef94 1000
fetch_jpg legacy/info-performance.jpg bdd27563-52a5-4313-bdc2-c7f9a627c10d 1000
fetch_jpg legacy/info-quality.jpg     d34b5794-0161-46ee-9da5-8689ece28897 1000
fetch_jpg legacy/info-quality-b.jpg   ac028f2e-a8a3-4295-ae00-ea717f06222c 1000
fetch_jpg legacy/info-comfort.jpg     4121f710-9911-4344-88b4-07f5b36c9b64 1000
fetch_jpg legacy/info-tech.jpg        294f9af0-278d-470f-8165-2ab5e72d8f96 800
fetch legacy/swirl-628.png ca10d1e4-c5cc-40ef-9bf3-07cd4123a196
fetch legacy/swirl-629.png eebf4de7-c6fd-4359-b803-520f0c6b98a8
fetch legacy/swirl-630.png 7736fd17-9231-4f7b-888b-3e52dc684bd6
fetch legacy/swirl-631.png c847285c-8db7-408d-9638-f7af733dbc21
fetch legacy/swirl-632.png 0767dd43-53bc-4c59-b374-eb782a41f517
fetch legacy/swirl-633.png c6d2ebce-8e6b-4afb-be5f-100cc216e132
fetch legacy/swirl-634.png 9f1a2d33-6093-49af-87f9-651dea49b359
fetch legacy/swirl-635.png 20d2c35d-9f56-4883-a8ad-c7a2ae763415
fetch legacy/swirl-636.png 2597e08d-9c87-46bf-827d-a7ea366ce852
fetch legacy/swirl-637.png a32399fa-a804-408a-be6c-050d2a1f0ba2
fetch legacy/swirl-638.png 585f7a7c-4854-4562-9e01-056375e7e298
fetch legacy/swirl-639.png fa5f6ff3-6649-4b24-987b-54856def73fa
fetch legacy/swirl-640.png ab9f3195-e805-49cf-a118-46c717ead3d8
fetch legacy/swirl-641.png 60cc012c-7724-4e53-a50a-57aaada4864e
fetch legacy/swirl-642.png 033f41a9-e802-44bf-90e0-64a5e66c862a
fetch legacy/swirl-643.png 515dc09e-3306-404b-b388-d97ff9baf2a9
