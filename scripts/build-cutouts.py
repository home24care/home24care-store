"""
Builds transparent "cut-out" copies of product packshots for dark panels.

The source photos are boxes on plain white. Near-white pixels connected to the
image border are treated as background and made transparent (white *inside*
the packaging is left alone), with a 1px feathered edge. Output sits next to
the other variants as <id>-cut.webp.

    python3 scripts/build-cutouts.py
"""
import json, pathlib
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

root = pathlib.Path(__file__).resolve().parent.parent
catalog = json.loads((root / 'data/catalog.json').read_text())
out = root / 'public/product-images'

done = 0
for p in catalog['products']:
    for img in p['images']:
        full = img['full']
        stem = full.rsplit('-', 1)[0]
        target = root / 'public' / (stem.lstrip('/') + '-cut.webp')
        src = Image.open(root / 'public' / full.lstrip('/')).convert('RGB')
        a = np.asarray(src).astype(np.int16)
        near_white = (a.min(axis=2) > 236) & ((a.max(axis=2) - a.min(axis=2)) < 14)
        labels, _ = ndimage.label(near_white)
        border = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
        bg = np.isin(labels, list(border))
        alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
        rgba = src.copy()
        rgba.putalpha(alpha)
        bbox = alpha.getbbox()
        if bbox:
            rgba = rgba.crop(bbox)
        rgba.save(target, 'WEBP', quality=80)
        done += 1
print(f'{done} cut-outs written')
