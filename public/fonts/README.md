# Font Setup

The demo uses **Geist** (by Vercel) for body/code with **Space Grotesk** for headings.
Geist falls back to IBM Plex Sans if the woff2 files aren't present.

## Quick Setup (Mac)

```bash
# Download Geist variable fonts from Fontsource
npm install @fontsource-variable/geist @fontsource-variable/geist-mono

# Copy the woff2 files into this directory
cp node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2 public/fonts/geist-sans-variable.woff2
cp node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2 public/fonts/geist-mono-variable.woff2
```

## Files Expected

| File | Font | Source |
|------|------|--------|
| `geist-sans-variable.woff2` | Geist Sans (variable) | [fontsource.org/fonts/geist](https://fontsource.org/fonts/geist/install) |
| `geist-mono-variable.woff2` | Geist Mono (variable) | [fontsource.org/fonts/geist-mono](https://fontsource.org/fonts/geist-mono/install) |
| `space-grotesk-500.woff2` | Space Grotesk 500-700 | Already present |
| `ibm-plex-sans-{400,500,600}.woff2` | IBM Plex Sans | Already present (fallback) |

## License

All fonts are licensed under the [SIL Open Font License](https://scripts.sil.org/OFL).
