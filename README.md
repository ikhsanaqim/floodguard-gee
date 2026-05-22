# 🌊 FloodGuard — GEE-Based Tidal Flood Risk Analysis & Prediction

A Google Earth Engine WebApp for comprehensive tidal flood (*banjir rob*) risk analysis and long-term prediction in **Semarang City, Central Java, Indonesia**.

🔗 **Live App:** [imustaqim776.users.earthengine.app/view/floodguard](https://imustaqim776.users.earthengine.app/view/floodguard)

---

## 🏆 Key Results

| Metric | Value |
|--------|-------|
| Model validation accuracy | **87.6%** (vs 2022 flood event data) |
| Current high-risk area | **18.43%** of Semarang |
| Projected risk area by 2125 (moderate) | **49.66%** of Semarang |
| System response time | < 2 seconds (most operations) |

---

## 📌 Background

Semarang City faces a compound flood risk driven by three interacting factors: sea level rise (4.3 mm/year), land subsidence (7–21 cm/year), and land use change. This system integrates 5 spatial parameters into a weighted GIS model, enabling both current risk mapping and 100-year projections (2025–2125).

---

## 🗺️ System Features

- **Interactive risk map** — 5-class tidal flood risk classification
- **Dynamic parameter control** — adjust sea level rise, tidal height, land subsidence, projection year via sliders
- **Multi-layer visualization** — DEM, slope, land use, coastline distance, river distance
- **Temporal projection** — risk scenarios from 2025 to 2125
- **Data export** — GeoTIFF download and CSV area statistics

---

## ⚖️ Parameter Weights

| Parameter | Weight | Classification |
|-----------|--------|---------------|
| Digital Elevation Model (DEM) | **25%** | 5 classes: ≤10m → >200m |
| Slope | 20% | 5 classes: 0–8% → >45% |
| Distance from Coastline | 20% | 5 classes: 0–500m → >3000m |
| Distance from River | 20% | 5 classes: 0–25m → >100m |
| Land Use | 15% | 5 classes: water/fishpond → forest/mangrove |

**Risk Index Score:**
- 1.0–1.5: Tidak Rawan (Not at risk)
- 1.5–2.5: Agak Rawan (Slightly at risk)
- 2.5–3.5: Cukup Rawan (Moderately at risk)
- 3.5–4.5: Rawan (High risk)
- 4.5–5.0: Sangat Rawan (Very high risk)

---

## 📊 Projection Scenarios (2025–2125)

| Year | Optimistic (ha) | Moderate (ha) | Pessimistic (ha) |
|------|----------------|---------------|-----------------|
| 2025 | 11,223 | 11,223 | 11,223 |
| 2050 | 13,208 | 14,209 | 15,211 |
| 2075 | 14,192 | 16,030 | 17,306 |
| 2100 | 15,185 | 17,298 | 18,789 |
| 2125 | 16,010 | 18,379 | 19,735 |

**Scenario parameters** (at HAT = 315 cm):

| Scenario | SLR (mm/yr) | Subsidence (cm/yr) |
|----------|-------------|-------------------|
| Optimistic | 1 | 7 |
| Moderate | 3 | 14 |
| Pessimistic | 5 | 21 |

---

## 📂 Repository Structure

```
floodguard-gee/
│
├── floodguard.js    # Main GEE JavaScript application
└── README.md        # This file
```

> **Note:** Spatial assets (DEM, land use, coastline, river, admin boundary)
> are hosted in the GEE project `banjirpasangikhsan`. To run locally,
> upload your own assets and update the asset paths in Section 1 of the code.

---

## 🚀 How to Run

### Option A — Use the live app (recommended)
🔗 [imustaqim776.users.earthengine.app/view/floodguard](https://imustaqim776.users.earthengine.app/view/floodguard)

### Option B — Run in GEE Code Editor
1. Open [code.earthengine.google.com](https://code.earthengine.google.com)
2. Create a new script
3. Paste the contents of `floodguard.js`
4. Update asset paths in Section 1 with your own GEE assets
5. Click **Run**

---

## 🛠️ Tech Stack

| Category | Tools |
|---|---|
| Platform | Google Earth Engine (JavaScript API) |
| Satellite Data | ESA Sentinel-2 (land use), DEMNAS/BIG (elevation) |
| Spatial Analysis | Weighted overlay, buffer analysis, terrain analysis |
| Tidal Data | BIG Tanjung Emas tide gauge (2013–2024) |
| Validation | Confusion matrix vs BPBD Semarang 2022 flood records |

---

## 📄 Related Publication

> Susanti, A.F.S., Putranto, R.T., Rahmadani, M.A., **Mustaqim, I.**, et al. (2024).
> IoT Instrumentation for Tidal Flood Monitoring Using ESP32.
> *IOP Conference Series: Earth and Environmental Science*, 1350(1).
> doi: [10.1088/1755-1315/1350/1/012046](https://doi.org/10.1088/1755-1315/1350/1/012046)

---

## 🔗 Related Project

**Tidal Prediction GRU** — A separate deep learning project (GRU/BiLSTM) for hourly water level time-series prediction using BMKG operational data.
→ [github.com/ikhsanaqim/tidal-prediction-gru](https://github.com/ikhsanaqim/tidal-prediction-gru)

---

## 👤 Author

**Ikhsan Mustaqim** — B.Sc. Oceanography, Universitas Diponegoro (2025)

Supervisors: Dr. Muhammad Helmi, S.Si., M.Si. · Prof. Dr. Sc. Anindya Wirasatriya, S.T., M.Si., M.Sc.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-ikhsanaqim-blue?logo=linkedin)](https://linkedin.com/in/ikhsanaqim)
[![GitHub](https://img.shields.io/badge/GitHub-ikhsanaqim-black?logo=github)](https://github.com/ikhsanaqim)
[![Live App](https://img.shields.io/badge/Live_App-FloodGuard-green?logo=google-earth)](https://imustaqim776.users.earthengine.app/view/floodguard)
