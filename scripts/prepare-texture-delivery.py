"""Preserve authored pixels and dimensions through the host's image CDN.
Run from the repository root with Pillow installed. The original JPEG files
remain as production sources; runtime materials load the lossless WebP files.
"""
from pathlib import Path
from PIL import Image

for name in ('moon-albedo', 'mars-albedo', 'painted-strata'):
    source = Path('public/media') / (name + '.jpg')
    with Image.open(source) as image:
        image.save(source.with_suffix('.webp'), 'WEBP', lossless=True, method=6)
        print(name, image.size)
