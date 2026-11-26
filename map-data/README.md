# map-data

`map-tunisia/` is a **local clone** of https://github.com/Alaa-Taieb/map-tunisia (v1.4.0 was used). It has its own git history and is **ignored** by this repository (`.gitignore`), so it isn't accidentally committed as a broken embedded repository.

The site only needs a small, validated subset, which is committed in `public/geo/`:

| File | Source |
| --- | --- |
| `governorates.geojson` | `dist/geojson/tunisia-governorates-low.geojson` (24 features) |
| `ben-arous-delegations.geojson` | `dist/geojson/tunisia-delegations-high.geojson`, features with `governorate = "TN-13"` (12 features) |
| `LICENSE-DATA.md` | the ODbL notice from Map Tunisia |
| `meta.json` | source version and attribution |

Geometry is copied unchanged. Only unused properties are dropped.

To refresh after updating the clone:
```powershell
git -C map-data/map-tunisia pull
npm run geo:build
```
`geo:build` refuses to write anything unless there are exactly 24 governorates and the 12 Ben Arous delegations (INS 1351–1362), every ring is closed and every coordinate is inside Tunisia.

Licences: Map Tunisia code is MIT. **Map data is ODbL 1.0, © OpenStreetMap contributors.** The files in `public/geo/` are a derived database and remain under the ODbL.
