"""Regenerate the app icon, Android adaptive icon layers, favicon and splash images
from the source art in assets/source/.

    uv run --with pillow --with numpy python scripts/build-brand-assets.py [out_dir/]
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

A = 'assets/'
OUT = sys.argv[1] if len(sys.argv) > 1 else A
APP_BG = np.array([255, 252, 243], float)  # #FFFCF3

poster = np.asarray(Image.open(A + 'source/splash-poster.jpg').convert('RGB'), float)
tile = np.asarray(Image.open(A + 'source/icon-art.jpg').convert('RGB'), float)
POSTER_PAPER = np.array([251, 248, 236], float)
TILE_PAPER = np.array([252, 245, 228], float)


def flatten(img, paper, target, t1=9.0, t2=24.0):
    """Map paper -> target (per-channel gain), then snap near-paper texture to flat target."""
    out = np.clip(img * (target / paper), 0, 255)
    d = np.linalg.norm(img - paper, axis=2)
    w = np.clip((d - t1) / (t2 - t1), 0, 1)[..., None]  # 0 = paper, 1 = ink
    return out * w + target * (1 - w), w[..., 0]


def to_img(a):
    return Image.fromarray(np.clip(a + 0.5, 0, 255).astype(np.uint8))


def bbox(ink, thresh=0.9, min_count=4):
    b = ink > thresh
    xs = np.where(b.sum(0) >= min_count)[0]
    ys = np.where(b.sum(1) >= min_count)[0]
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def place(art, box, size, content, bg, cx=0.5, cy=0.5):
    """Scale art[box] so its longer side = content px, centered on a size x size bg canvas."""
    crop = art.crop(box)
    s = content / max(crop.size)
    crop = crop.resize((round(crop.width * s), round(crop.height * s)), Image.LANCZOS)
    canvas = Image.new('RGB', (size, size), bg)
    canvas.paste(crop, (round(size * cx - crop.width / 2), round(size * cy - crop.height / 2)))
    return canvas


# ---------- icon art: interior of the gold-bordered tile ----------
# gold border spans x 106-837, y 174-946; keep only well inside it
rect = Image.new('L', tile.shape[1::-1], 0)
ImageDraw.Draw(rect).rounded_rectangle((150, 218, 793, 902), radius=110, fill=255)
rect = np.asarray(rect, float) / 255


def tile_art(target):
    flat, ink = flatten(tile, TILE_PAPER, target)
    strong = ((ink > 0.9) * rect * 255).astype(np.uint8)
    # soft mask around the drawn food only; everything else becomes flat paper
    m = Image.fromarray(strong).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    m = m.filter(ImageFilter.MaxFilter(25)).filter(ImageFilter.GaussianBlur(6))
    m = np.asarray(m, float)[..., None] / 255
    flat = flat * m + target * (1 - m)
    return to_img(flat), bbox(ink * rect)


icon_art, icon_box = tile_art(TILE_PAPER)
print('icon content bbox', icon_box)
paper_hex = '#%02X%02X%02X' % tuple(int(c) for c in TILE_PAPER)
print('icon paper', paper_hex)

# iOS / universal icon: full-bleed, content ~80%
place(icon_art, icon_box, 1024, 810, tuple(int(c) for c in TILE_PAPER)).save(OUT + 'icon.png')

# favicon
place(icon_art, icon_box, 256, 226, tuple(int(c) for c in TILE_PAPER)).resize((48, 48), Image.LANCZOS).save(OUT + 'favicon.png')

# Android adaptive foreground: 108dp canvas, keep art inside the ~72dp visible circle
FG = 530
fg = place(icon_art, icon_box, 1024, FG, tuple(int(c) for c in TILE_PAPER)).convert('RGBA')
fg.save(OUT + 'android-icon-foreground.png')

# Android monochrome: the dark line art only
gray = np.asarray(place(icon_art, icon_box, 1024, FG, tuple(int(c) for c in TILE_PAPER)).convert('L'), float)
alpha = np.clip((125 - gray) / 45, 0, 1) * 255
mono = np.zeros((1024, 1024, 4), np.uint8)
mono[..., :3] = 255
mono[..., 3] = alpha.astype(np.uint8)
Image.fromarray(mono, 'RGBA').save(OUT + 'android-icon-monochrome.png')

# ---------- splash ----------
# Android 12+: icon masked to a circle -> use the food grid on app background
splash_art, splash_box = tile_art(APP_BG)
place(splash_art, splash_box, 1024, 1024, tuple(int(c) for c in APP_BG)).save(OUT + 'splash-icon.png')

# iOS: the full poster, paper matched to app background, trimmed to its content
pflat, pink = flatten(poster, POSTER_PAPER, APP_BG)
x0, y0, x1, y1 = bbox(pink)
print('poster content bbox', (x0, y0, x1, y1))
pad = 24
pimg = to_img(pflat).crop((max(x0 - pad, 0), max(y0 - pad, 0), min(x1 + pad, poster.shape[1]), min(y1 + pad, poster.shape[0])))
print('poster size', pimg.size)
pimg.save(OUT + 'splash-poster.png', optimize=True)
