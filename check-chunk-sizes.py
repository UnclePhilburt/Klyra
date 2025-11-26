import json

chunks = [
    r'C:\klyra\game\assets\ldtk\biomes\Dark Forest\chunk1.ldtk',
    r'C:\klyra\game\assets\ldtk\biomes\Dark Forest\chunk2.ldtk',
    r'C:\klyra\game\assets\ldtk\biomes\Dark Forest\chunk3.ldtk',
    r'C:\klyra\game\assets\ldtk\biomes\Dark Forest\chunk4.ldtk',
    r'C:\klyra\game\assets\ldtk\biomes\Dark Forest\chunk5.ldtk',
]

for chunk_path in chunks:
    try:
        with open(chunk_path) as f:
            data = json.load(f)
            level = data['levels'][0]
            print(f"{chunk_path.split('\\')[-1]}: {level['pxWid']}x{level['pxHei']} pixels")
    except Exception as e:
        print(f"{chunk_path.split('\\')[-1]}: ERROR - {e}")
