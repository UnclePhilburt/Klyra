import json

chunk_path = r'C:\klyra\game\assets\ldtk\biomes\Dark Forest\chunk1.ldtk'

with open(chunk_path) as f:
    data = json.load(f)

    print("Tilesets in chunk1.ldtk:")
    for tileset in data['defs']['tilesets']:
        print(f"  - {tileset['identifier']}")
        print(f"    UID: {tileset['uid']}")
        print(f"    Path: {tileset['relPath']}")
        print(f"    Tile grid size: {tileset['tileGridSize']}px")
        print(f"    Image size: {tileset['pxWid']}x{tileset['pxHei']}px")
        print(f"    Tiles: {tileset['pxWid'] // tileset['tileGridSize']}x{tileset['pxHei'] // tileset['tileGridSize']}")
        print()
