"""Compress NASA VTAD's MER_static.glb for the browser without changing its geometry.

Run with Pillow: python3 scripts/prepare-mer.py MER_static.glb public/media/mer-vtad.glb
"""
import io
import json
import struct
import sys
from pathlib import Path

from PIL import Image

source = Path(sys.argv[1]).read_bytes()
magic, version, _ = struct.unpack_from('<4sII', source)
assert magic == b'glTF' and version == 2
json_size, _ = struct.unpack_from('<II', source, 12)
manifest = json.loads(source[20:20 + json_size])
data = source[28 + json_size:]
images = {image['bufferView']: image for image in manifest['images']}
chunks = bytearray()
for index, view in enumerate(manifest['bufferViews']):
    start = view.get('byteOffset', 0)
    raw = data[start:start + view['byteLength']]
    if index in images:
        image = Image.open(io.BytesIO(raw)).convert('RGB')
        image.thumbnail((1536, 1536), Image.Resampling.LANCZOS)
        stream = io.BytesIO()
        image.save(stream, format='JPEG', quality=93, subsampling=0, optimize=True)
        raw = stream.getvalue()
        images[index]['mimeType'] = 'image/jpeg'
    chunks.extend(b'\0' * (-len(chunks) % 4))
    view['byteOffset'] = len(chunks)
    view['byteLength'] = len(raw)
    chunks.extend(raw)
chunks.extend(b'\0' * (-len(chunks) % 4))
manifest['buffers'][0]['byteLength'] = len(chunks)
encoded = json.dumps(manifest, separators=(',', ':')).encode()
encoded += b' ' * (-len(encoded) % 4)
target = struct.pack('<4sII', magic, version, 28 + len(encoded) + len(chunks))
target += struct.pack('<I4s', len(encoded), b'JSON') + encoded
target += struct.pack('<I4s', len(chunks), b'BIN\0') + chunks
Path(sys.argv[2]).write_bytes(target)
