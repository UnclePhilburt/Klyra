import json

chunk_path = r'C:\klyra\game\assets\ldtk\biomes\Dark Forest\chunk1.ldtk'

with open(chunk_path) as f:
    data = json.load(f)
    level = data['levels'][0]

    print(f"Level: {level['identifier']}")
    print(f"Pixel dimensions: {level['pxWid']}x{level['pxHei']}")
    print(f"\nLayers:")

    for layer in level['layerInstances']:
        print(f"  - {layer['__identifier']} ({layer['__type']})")
        print(f"    Grid size: {layer['__gridSize']}px")
        print(f"    Cell dimensions: {layer['__cWid']}x{layer['__cHei']} cells")
        print(f"    Total grid: {layer['__cWid']} * {layer['__cHei']} = {layer['__cWid'] * layer['__cHei']} tiles")

        if layer['__tilesetDefUid']:
            tileset = next((t for t in data['defs']['tilesets'] if t['uid'] == layer['__tilesetDefUid']), None)
            if tileset:
                print(f"    Tileset: {tileset['identifier']} ({tileset['tileGridSize']}px tiles)")
        print()
