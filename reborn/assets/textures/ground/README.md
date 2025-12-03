# Ground Textures - Unreal Fab (Quixel Megascans)

This folder contains PBR (Physically Based Rendering) ground textures for use in the level editor.

## How to Download Textures from Unreal Fab

1. **Visit Unreal Fab**: Go to [fab.com](https://fab.com) (formerly Quixel Megascans)
2. **Sign In**: Create a free Epic Games account or sign in
3. **Browse Ground Textures**: Search for ground, terrain, dirt, grass, etc.
4. **Download**: Select a texture and download the PBR maps

## Folder Structure

Each texture should be in its own subfolder with the following structure:

```
assets/textures/ground/
├── dirt/
│   ├── albedo.jpg         (Base color/diffuse map)
│   ├── normal.jpg         (Normal map for surface detail)
│   ├── roughness.jpg      (Roughness map)
│   ├── ao.jpg            (Ambient occlusion map)
│   └── displacement.jpg   (Height/displacement map - optional)
├── grass/
│   ├── albedo.jpg
│   ├── normal.jpg
│   ├── roughness.jpg
│   ├── ao.jpg
│   └── displacement.jpg
├── mud/
│   └── ...
└── ...
```

## Texture Map Types

### Required:
- **albedo.jpg** - The base color of the texture (diffuse/color map)

### Recommended:
- **normal.jpg** - Adds surface detail and bumps
- **roughness.jpg** - Controls how shiny/rough the surface appears
- **ao.jpg** - Ambient occlusion for depth and shadowing

### Optional:
- **displacement.jpg** - Can add actual geometry displacement (not widely used due to performance)

## Recommended Textures from Unreal Fab

### For Military/War Game:
1. **Dry Dirt** - Search: "dry ground", "desert soil"
2. **Muddy Ground** - Search: "wet mud", "muddy terrain"
3. **Sand** - Search: "sand ground", "desert sand"
4. **Rocky Terrain** - Search: "rocky ground", "gravel"
5. **Forest Floor** - Search: "forest ground", "moss"
6. **Snow** - Search: "snow ground"

## File Naming Convention

The level editor expects these exact filenames:
- `albedo.jpg` (or .png)
- `normal.jpg`
- `roughness.jpg`
- `ao.jpg`
- `displacement.jpg`

**Note**: Files can be .jpg or .png format. Update the `loadGroundTexture` function in `level-editor.js` if you prefer PNG.

## Texture Resolution

For best performance and quality:
- **Recommended**: 2048x2048 or 4096x4096
- **Minimum**: 1024x1024
- Higher resolution = better quality but slower loading

## Tips

1. **Free Textures**: Many Unreal Fab textures are free with Epic Games account
2. **Optimization**: Compress textures if needed for faster loading
3. **Tiling**: The editor automatically tiles textures across the ground (20x repeat)
4. **Custom Textures**: You can add your own PBR textures following the same structure

## Example Download Process

1. Go to fab.com
2. Search for "ground dirt"
3. Select a texture (e.g., "Dry Cracked Dirt")
4. Click "Download"
5. Choose resolution (2K or 4K recommended)
6. Download will include: Albedo, Normal, Roughness, AO, Displacement
7. Create folder: `assets/textures/ground/dirt/`
8. Rename and place files according to structure above
9. Restart level editor and select from Terrain tab

## Troubleshooting

**Texture not loading?**
- Check folder name matches the ID in `level-editor.js` (line 187-192)
- Verify file names are exactly: albedo.jpg, normal.jpg, etc.
- Check browser console (F12) for error messages
- Make sure server is running (port 9000)

**Texture looks wrong?**
- Adjust the `repeat` value in `level-editor.js` line 98 (default is 20)
- Check that normal map is in the correct format (tangent space)
- Verify roughness map is loaded (grayscale)

## Performance Notes

Loading high-resolution PBR textures can take time. The editor shows notifications when:
- Loading starts: "Loading [texture name]..."
- Loading completes: "[texture name] applied!"
- Error occurs: "Error loading texture"
