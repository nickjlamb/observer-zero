#!/usr/bin/env python3
"""Patch fig1ab-world.pdf panel-b texts (Deep Review change 5, drawn-text side):
  title: 'Identical surface correlation, different origin'
         -> 'Matched lagged correlation structure, different origin'
  annotation: 'an in-world mechanism reproduces the same lagged correlation (r = 0.9)'
         -> 'an in-world mechanism reproduces a closely matched lagged correlation (r = 0.90-0.97)'
Old BT..ET blocks are REMOVED from the content stream (no hidden text left),
then replacements are drawn as an overlay with fully embedded DejaVu fonts.
"""
import io, re
from pypdf import PdfReader, PdfWriter
from pypdf.generic import DecodedStreamObject, NameObject
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

W, H = 518.4, 259.2
SRC = "fig1ab-world.pdf"

reader = PdfReader(SRC)
page = reader.pages[0]
raw = page.get_contents().get_data().decode("latin-1")

def block_text(bl):
    """Reconstruct the string of a matplotlib CID text block (2-byte unicode)."""
    chars = []
    for grp in re.findall(r"\(((?:\\.|[^()\\])+)\)", bl):
        grp = grp.replace("\\(", "(").replace("\\)", ")").replace("\\\\", "\\")
        for i in range(0, len(grp) - 1, 2):
            chars.append(chr((ord(grp[i]) << 8) | ord(grp[i + 1])))
    return "".join(chars)

blocks = re.findall(r"BT.*?ET", raw, re.S)
targets = []
for bl in blocks:
    t = block_text(bl)
    if "Identical surface correlation" in t or "same lagged correlation" in t:
        targets.append((bl, t))
assert len(targets) == 2, f"expected 2 target blocks, got {len(targets)}: " + \
    " | ".join(t[:60] for _, t in targets)
for bl, t in targets:
    print("removing block:", repr(t[:70]))
    raw = raw.replace(bl, "", 1)

new_stream = DecodedStreamObject()
new_stream.set_data(raw.encode("latin-1"))
page.replace_contents(new_stream)

# ---- overlay the replacement strings ----------------------------------------
pdfmetrics.registerFont(TTFont("DVB", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DV", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
buf = io.BytesIO()
c = canvas.Canvas(buf, pagesize=(W, H))
c.setFillColorRGB(0, 0, 0)
# Title: match the ORIGINAL title's font size exactly: the old string spanned
# x 234.70 -> 424.21; solve the size from DejaVu Bold metrics.
OLD_TITLE = "Identical surface correlation, different origin"
size_t = (424.21 - 234.70) / pdfmetrics.stringWidth(OLD_TITLE, "DVB", 1.0)
c.setFont("DVB", size_t)
c.drawString(224.1, H - 22.69, "b")   # the panel letter was part of the removed block
c.drawString(234.7, H - 22.69, "Matched lagged correlation structure, different origin")
# Annotation: same approach; old string spanned x 232.78 -> 430.50. Keep the
# original LEFT edge (centring the longer string would overlap panel a).
OLD_ANN = "an in-world mechanism reproduces the same lagged correlation (r ≈ 0.9)"
size_a = (430.50 - 232.78) / pdfmetrics.stringWidth(OLD_ANN, "DV", 1.0)
c.setFont("DV", size_a)
new_ann = "an in-world mechanism reproduces a closely matched lagged correlation (r ≈ 0.90-0.97)"
c.drawString(232.78, H - 253.65, new_ann)
print(f"title size {size_t:.2f}pt, annotation size {size_a:.2f}pt; "
      f"title ends x={234.7 + pdfmetrics.stringWidth('Matched lagged correlation structure, different origin', 'DVB', size_t):.1f}, "
      f"annotation ends x={232.78 + pdfmetrics.stringWidth(new_ann, 'DV', size_a):.1f} (page {W})")
c.save()
buf.seek(0)
page.merge_page(PdfReader(buf).pages[0])

writer = PdfWriter()
writer.add_page(page)
with open(SRC, "wb") as f:
    writer.write(f)
print("patched", SRC)
