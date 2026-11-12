# Preview images

This folder holds two layers of images for the landing page.

| Path | Role | Referenced by the site? |
| --- | --- | --- |
| `originals/<theme>/*.png` | Full-resolution PNG masters (source of truth) | No |
| `<theme>/*.jpg` | Optimised production images (max 1280px, JPEG q82) | Yes (`index.html`) |
| `favicon.ico` | Browser tab icon (16, 32 and 48px, 32-bpp) | Yes (`index.html`) |
| `icon.png` | App icon and logo mark (512px square) | Yes (`index.html`) |

`<theme>` is `dark` or `light`. The page swaps between the two via the theme toggle.

## Regenerating the production images

The production JPEGs are **generated**, never hand-edited. After adding or updating a
master in `originals/<theme>/`, run from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File tools/generate-images.ps1
```

Optional overrides (defaults shown):

```powershell
powershell -ExecutionPolicy Bypass -File tools/generate-images.ps1 -MaxWidth 1280 -Quality 82
```

Keep the file names identical between `originals/<theme>/` and `<theme>/`
(only the extension changes: `.png` -> `.jpg`) so a script run always produces the
exact set of files the page expects.

## Notes

- Master PNGs are committed for provenance, but GitHub Pages also publishes every file in
  the repo, so these masters add ~5 MB to the deployed artifact even though the page never
  requests them. If that matters, either move the site into a `/docs` folder and set Pages
  to deploy from `/docs`, or keep the masters in a separate branch/repository.
- Screenshots are captured with a placeholder account (`Anonymous#GG`) and carry the standard
  "not endorsed by Riot Games" disclaimer.
