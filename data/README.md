# Data

Datasets for NeMo-Ray, organised by processing stage.

- **`retrieved/`** — raw data pulled from external sources, kept as fetched
  (lightly scoped/filtered only — no derivation).
- **`processed/`** — postprocessed / derived datasets produced by our pipeline.

## Contents

### `retrieved/`

- `SITEFINDER_London_EEproxy.csv` — Ofcom Sitefinder mobile-mast records scoped
  to Greater London, used as an EE network proxy. Columns: `Operator`, `Opref`,
  `Sitengr` (OS grid ref), `Antennaht`, `Transtype`, `Freqband`, `Powerdbw`,
  `Maxpwrdbw`, `Maxpwrdbm`, `Sitelat`, `Sitelng`.
