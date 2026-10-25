"""Independent raw LZMA/LZMA2 fixtures from Python's native liblzma binding."""
import json
import lzma
import pathlib
import random

root = pathlib.Path(".build/corpus")
root.mkdir(parents=True, exist_ok=True)
rng = random.Random(20261025)
cases = []
for method, filter_id in [("lzma", lzma.FILTER_LZMA1), ("lzma2", lzma.FILTER_LZMA2)]:
    for index, size in enumerate([0, 1, 2, 4, 31, 257, 4096, 65537, 262144]):
        for kind in ["random", "repeated"]:
            plain = rng.randbytes(size) if kind == "random" else (b"LZMA SDK raw data\0" * (size // 18 + 1))[:size]
            compressed = lzma.compress(plain, format=lzma.FORMAT_RAW,
                filters=[{"id": filter_id, "dict_size": 65536}])
            props = bytes([0x5d, 0, 0, 1, 0]) if method == "lzma" else bytes([8])
            name = f"{method}-{index}-{kind}"
            for suffix, data in [("packed", compressed), ("plain", plain), ("props", props)]:
                (root / f"{name}.{suffix}").write_bytes(data)
            cases.append({"name": name, "method": method, "size": len(plain)})
(root / "index.json").write_text(json.dumps(cases))
