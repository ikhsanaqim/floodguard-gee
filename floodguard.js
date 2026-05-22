// ============================================================
// FLOODGUARD — GEE-Based Tidal Flood Risk Analysis & Prediction
// Kota Semarang, Jawa Tengah, Indonesia
// 
// Author  : Ikhsan Mustaqim
// Thesis  : GEE-Based GIS System for Tidal Flood Risk Analysis
//           and Prediction in Semarang City (UNDIP, 2025)
// Advisor : Dr. Muhammad Helmi, S.Si., M.Si.
//           Prof. Dr. Sc. Anindya Wirasatriya, S.T., M.Si., M.Sc.
// Live App: https://imustaqim776.users.earthengine.app/view/floodguard
// ============================================================

// ============================================================
// 1. LOAD DATASETS
// ============================================================
var lu       = ee.Image("projects/banjirpasangikhsan/assets/LU"),
    demnas   = ee.Image("projects/banjirpasangikhsan/assets/dem"),
    pantai   = ee.Image("projects/banjirpasangikhsan/assets/pantai"),
    semarang = ee.FeatureCollection("projects/banjirpasangikhsan/assets/semarang"),
    sungai   = ee.Image("projects/banjirpasangikhsan/assets/sungai"),
    admin    = ee.FeatureCollection("projects/banjirpasangikhsan/assets/semarang");

// ============================================================
// 2. PARAMETER WEIGHTS
// Based on literature review and validation against 2022 flood data
// Validation accuracy: 87.6%
// ============================================================
var WEIGHTS = {
  slope    : 0.20,  // Kemiringan lereng
  dem      : 0.25,  // Elevasi permukaan (DEM)
  coastline: 0.20,  // Jarak dari garis pantai
  river    : 0.20,  // Jarak dari sungai
  landuse  : 0.15   // Penggunaan lahan
};

// ============================================================
// 3. VISUALIZATION PARAMETERS
// ============================================================
var RISK_PALETTE = ['#1a9850', '#d9ef8b', '#fee08b', '#fc8d59', '#d73027'];

var VIS_PARAMS = {
  dem: {
    min: 0, max: 200,
    palette: ['006837', '66bd63', 'd9ef8b', 'fee08b', 'd73027']
  },
  landuse: {
    min: 1, max: 5,
    palette: ['24962c', '55a85b', '79b892', 'd5d5d5', 'a8c5d5']
  },
  coastline: {
    min: 1, max: 5,
    palette: ['fee5d9', 'fcae91', 'fb6a4a', 'de2d26', 'a50f15']
  },
  river: {
    min: 1, max: 5,
    palette: ['eff3ff', 'bdd7e7', '6baed6', '3182bd', '08519c']
  },
  slope: {
    min: 0, max: 45,
    palette: ['ffffcc', 'a1dab4', '41b6c4', '2c7fb8', '253494']
  },
  admin: { color: 'FF0000', width: 2 }
};

// ============================================================
// 4. PREPROCESS DATA
// ============================================================
var dem             = demnas.clip(semarang);
var slopeDegrees    = ee.Terrain.slope(dem);
var slope           = slopeDegrees.multiply(Math.PI).divide(180).tan().multiply(100);
var landuse         = lu.clip(semarang);
var coastlineBuffer = pantai.clip(semarang);
var riverBuffer     = sungai.clip(semarang);

// ============================================================
// 5. UI SETUP
// ============================================================
var leftPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: { width: '300px', padding: '8px', position: 'top-left' }
});

var mapPanel = ui.Map();

ui.root.clear();
ui.root.add(ui.SplitPanel({
  firstPanel : leftPanel,
  secondPanel: mapPanel,
  orientation: 'horizontal'
}));

// Title
var titlePanel = ui.Panel({
  widgets: [
    ui.Label('SISTEM INFORMASI GEOGRAFIS', {
      fontWeight: 'bold', fontSize: '16px',
      margin: '0 0 4px 0', padding: '4px', textAlign: 'center'
    }),
    ui.Label('RISIKO BANJIR PASANG', {
      fontWeight: 'bold', fontSize: '16px',
      margin: '0 0 4px 0', padding: '4px', textAlign: 'center'
    }),
    ui.Label('KOTA SEMARANG', {
      fontWeight: 'bold', fontSize: '16px',
      margin: '0 0 4px 0', padding: '4px', textAlign: 'center'
    })
  ],
  style: {
    backgroundColor: 'white', border: '1px solid #ccc',
    margin: '0 0 8px 0', width: '100%'
  }
});
leftPanel.add(titlePanel);

// ============================================================
// 6. LAYER SELECTOR & PARAMETER CONTROLS
// ============================================================
var layerSelect = ui.Select({
  items : ['Risiko Banjir Pasang', 'Elevasi Daratan', 'Kemiringan Lereng',
           'Penggunaan Lahan', 'Jarak dari Garis Pantai', 'Jarak dari Sungai',
           'Batas Administrasi'],
  value : 'Risiko Banjir Pasang',
  onChange: updateDisplayedLayer,
  style : { stretch: 'horizontal' }
});
leftPanel.add(ui.Label('Pilih Layer:', { fontWeight: 'bold', padding: '4px' }));
leftPanel.add(layerSelect);

leftPanel.add(ui.Label('Kontrol Parameter', { fontWeight: 'bold', fontSize: '14px', padding: '8px' }));

// Sliders
var seaLevelRiseSlider = ui.Slider({ min: 0, max: 20,   value: 0, step: 0.1, onChange: updateFloodMap, style: { stretch: 'horizontal' } });
var yearSlider         = ui.Slider({ min: 2025, max: 2125, value: 2025, step: 1, onChange: updateFloodMap, style: { stretch: 'horizontal' } });
var tidalSlider        = ui.Slider({ min: 0, max: 3000, value: 0, step: 1,   onChange: updateFloodMap, style: { stretch: 'horizontal' } });
var subsidenceSlider   = ui.Slider({ min: 0, max: 20,   value: 0, step: 0.1, onChange: updateFloodMap, style: { stretch: 'horizontal' } });

leftPanel.add(ui.Label('Laju Kenaikan Muka Air Laut (mm/tahun)', { fontWeight: 'bold', padding: '4px' }));
leftPanel.add(seaLevelRiseSlider);
leftPanel.add(ui.Label('Tahun Proyeksi', { fontWeight: 'bold', padding: '4px' }));
leftPanel.add(yearSlider);
leftPanel.add(ui.Label('Tinggi Air Pasang (cm)', { fontWeight: 'bold', padding: '4px' }));
leftPanel.add(tidalSlider);
leftPanel.add(ui.Label('Laju Penurunan Tanah (cm/tahun)', { fontWeight: 'bold', padding: '4px' }));
leftPanel.add(subsidenceSlider);

var resultsPanel = ui.Panel({ style: { padding: '8px', margin: '8px 0', backgroundColor: 'white', border: '1px solid #ccc' } });
leftPanel.add(resultsPanel);

var legendPanel = ui.Panel({ style: { padding: '8px', margin: '8px 0', backgroundColor: 'white', border: '1px solid #ccc' } });
leftPanel.add(legendPanel);

// ============================================================
// 7. CLASSIFICATION FUNCTIONS
// ============================================================
function classifySlope(image) {
  return image.expression(
    '(b(0) <= 8) ? 5 : (b(0) <= 15) ? 4 : (b(0) <= 25) ? 3 : (b(0) <= 45) ? 2 : 1'
  );
}

function classifyDEM(image) {
  return image.expression(
    '(b(0) <= 10) ? 5 : (b(0) <= 50) ? 4 : (b(0) <= 100) ? 3 : (b(0) <= 200) ? 2 : 1'
  );
}

// ============================================================
// 8. FLOOD RISK CALCULATION
// Scenarios (at HAT = 315 cm):
//   Optimistic : SLR 1 mm/yr, subsidence  7 cm/yr
//   Moderate   : SLR 3 mm/yr, subsidence 14 cm/yr
//   Pessimistic: SLR 5 mm/yr, subsidence 21 cm/yr
// ============================================================
function calculateFloodRisk(predictionYear, tidalHeightCm, subsidenceRateCmYear) {
  var yearsSince2025 = predictionYear - 2025;
  var seaLevelRiseM  = yearsSince2025 * (seaLevelRiseSlider.getValue() / 1000);
  var subsidenceM    = (yearsSince2025 * subsidenceRateCmYear) / 100;
  var tidalHeightM   = ee.Number(tidalHeightCm).divide(100);

  var modifiedDEM = dem
    .subtract(subsidenceM)
    .subtract(tidalHeightM)
    .subtract(seaLevelRiseM);

  var slopeScore     = classifySlope(slope);
  var demScore       = classifyDEM(modifiedDEM);
  var coastlineScore = coastlineBuffer.remap([1,2,3,4,5],[1,2,3,4,5]);
  var riverScore     = riverBuffer.remap([1,2,3,4,5],[1,2,3,4,5]);
  var landuseScore   = landuse.remap([1,2,3,4,5],[1,2,3,4,5]);

  var floodRiskIndex = slopeScore.multiply(WEIGHTS.slope)
    .add(demScore.multiply(WEIGHTS.dem))
    .add(coastlineScore.multiply(WEIGHTS.coastline))
    .add(riverScore.multiply(WEIGHTS.river))
    .add(landuseScore.multiply(WEIGHTS.landuse));

  // Risk classification:
  // 1 = Tidak Rawan | 2 = Agak Rawan | 3 = Cukup Rawan | 4 = Rawan | 5 = Sangat Rawan
  var riskClass = floodRiskIndex.expression(
    '(b(0) >= 4.5) ? 5 : (b(0) >= 3.5) ? 4 : (b(0) >= 2.5) ? 3 : (b(0) >= 1.5) ? 2 : 1'
  );

  return [riskClass, modifiedDEM];
}

// ============================================================
// 9. MAP UPDATE FUNCTIONS
// ============================================================
function updateDisplayedLayer(selected) {
  mapPanel.layers().reset();
  switch(selected) {
    case 'Elevasi Daratan':
      mapPanel.addLayer(dem, VIS_PARAMS.dem, 'DEM');
      updateDEMLegend(); break;
    case 'Kemiringan Lereng':
      mapPanel.addLayer(slope, VIS_PARAMS.slope, 'Kemiringan Lereng');
      updateSlopeLegend(); break;
    case 'Penggunaan Lahan':
      mapPanel.addLayer(landuse, VIS_PARAMS.landuse, 'Penggunaan Lahan');
      updateLanduseLegend(); break;
    case 'Jarak dari Garis Pantai':
      mapPanel.addLayer(coastlineBuffer, VIS_PARAMS.coastline, 'Buffer Pantai');
      updateCoastlineLegend(); break;
    case 'Jarak dari Sungai':
      mapPanel.addLayer(riverBuffer, VIS_PARAMS.river, 'Buffer Sungai');
      updateRiverLegend(); break;
    case 'Batas Administrasi':
      mapPanel.addLayer(admin.style(VIS_PARAMS.admin), {}, 'Batas Administrasi');
      updateAdminLegend(); break;
    default:
      updateFloodMap(); break;
  }
}

function updateFloodMap() {
  if (layerSelect.getValue() === 'Risiko Banjir Pasang') {
    var predictionYear = yearSlider.getValue();
    var tidalHeightCm  = tidalSlider.getValue();
    var subsidenceRate = subsidenceSlider.getValue();
    var seaLevelRise   = seaLevelRiseSlider.getValue();

    var results     = calculateFloodRisk(predictionYear, tidalHeightCm, subsidenceRate);
    var floodRisk   = results[0];
    var modifiedDEM = results[1];
    var floodedArea = modifiedDEM.lt(0);

    mapPanel.layers().reset();
    mapPanel.addLayer(floodRisk.clip(semarang), {
      min: 1, max: 5, palette: RISK_PALETTE
    }, 'Risiko Banjir Pasang');
    mapPanel.addLayer(
      floodedArea.updateMask(floodedArea).clip(semarang),
      { palette: ['0000FF'] }, 'Area Tergenang'
    );

    resultsPanel.clear();
    resultsPanel.add(ui.Label('Faktor Analisis:', { fontWeight: 'bold' }));
    resultsPanel.add(ui.Label('Tahun Proyeksi: ' + predictionYear));
    resultsPanel.add(ui.Label('Tinggi Air Pasang: ' + tidalHeightCm.toFixed(0) + ' cm'));
    resultsPanel.add(ui.Label('Laju Penurunan: ' + subsidenceRate.toFixed(1) + ' cm/tahun'));
    resultsPanel.add(ui.Label('Kenaikan Muka Air Laut: ' + seaLevelRise.toFixed(1) + ' mm/tahun'));

    createFloodRiskLegend();
  }
}

// ============================================================
// 10. LEGEND FUNCTIONS
// ============================================================
function makeLegendItem(color, label) {
  var box = ui.Label('', { backgroundColor: color, padding: '8px', margin: '0 0 4px 0' });
  var lbl = ui.Label(label, { margin: '0 0 4px 6px' });
  return ui.Panel([box, lbl], ui.Panel.Layout.Flow('horizontal'));
}

function updateDEMLegend() {
  legendPanel.clear();
  legendPanel.add(ui.Label('Elevasi (mdpl):', { fontWeight: 'bold' }));
  var ranges = ['0 - 10', '10 - 50', '50 - 100', '100 - 200', '> 200'];
  VIS_PARAMS.dem.palette.forEach(function(c, i) {
    legendPanel.add(makeLegendItem('#' + c, ranges[i]));
  });
}

function updateSlopeLegend() {
  legendPanel.clear();
  legendPanel.add(ui.Label('Kemiringan (%):', { fontWeight: 'bold' }));
  var ranges = ['0 - 8', '8 - 15', '15 - 25', '25 - 45', '> 45'];
  VIS_PARAMS.slope.palette.forEach(function(c, i) {
    legendPanel.add(makeLegendItem('#' + c, ranges[i]));
  });
}

function updateLanduseLegend() {
  legendPanel.clear();
  legendPanel.add(ui.Label('Penggunaan Lahan:', { fontWeight: 'bold' }));
  var types = ['Hutan, Mangrove', 'Perkebunan, Semak', 'Pertanian, Sawah', 'Pemukiman', 'Badan Air, Tambak'];
  VIS_PARAMS.landuse.palette.forEach(function(c, i) {
    legendPanel.add(makeLegendItem('#' + c, types[i]));
  });
}

function updateCoastlineLegend() {
  legendPanel.clear();
  legendPanel.add(ui.Label('Jarak dari Pantai (m):', { fontWeight: 'bold' }));
  var ranges = ['> 2000', '1500 - 2000', '1000 - 1500', '500 - 1000', '0 - 500'];
  VIS_PARAMS.coastline.palette.forEach(function(c, i) {
    legendPanel.add(makeLegendItem('#' + c, ranges[i]));
  });
}

function updateRiverLegend() {
  legendPanel.clear();
  legendPanel.add(ui.Label('Jarak dari Sungai (m):', { fontWeight: 'bold' }));
  var ranges = ['> 1000', '750 - 1000', '500 - 750', '250 - 500', '0 - 250'];
  VIS_PARAMS.river.palette.forEach(function(c, i) {
    legendPanel.add(makeLegendItem('#' + c, ranges[i]));
  });
}

function updateAdminLegend() {
  legendPanel.clear();
  legendPanel.add(ui.Label('Batas Administrasi:', { fontWeight: 'bold' }));
  legendPanel.add(makeLegendItem('#FF0000', 'Batas Kecamatan'));
}

function createFloodRiskLegend() {
  legendPanel.clear();
  legendPanel.add(ui.Label('Tingkat Kerawanan:', { fontWeight: 'bold' }));
  var labels = ['Tidak Rawan', 'Agak Rawan', 'Cukup Rawan', 'Rawan', 'Sangat Rawan'];
  RISK_PALETTE.forEach(function(c, i) {
    legendPanel.add(makeLegendItem(c, labels[i]));
  });
  legendPanel.add(ui.Label('Area Tergenang:', { fontWeight: 'bold', margin: '8px 0 4px 0' }));
  legendPanel.add(makeLegendItem('#0000FF', 'Area Tergenang'));
}

// ============================================================
// 11. DOWNLOAD PANEL
// ============================================================
var downloadPanel = ui.Panel({ style: { padding: '8px', margin: '8px 0', backgroundColor: 'white', border: '1px solid #ccc' } });
leftPanel.add(downloadPanel);
downloadPanel.add(ui.Label('Download Data', { fontWeight: 'bold', fontSize: '14px', padding: '4px' }));

var downloadSelect = ui.Select({
  items: ['Risiko Banjir Pasang', 'Elevasi Daratan', 'Kemiringan Lereng',
          'Penggunaan Lahan', 'Jarak dari Garis Pantai', 'Jarak dari Sungai', 'Area Tergenang'],
  value: 'Risiko Banjir Pasang',
  style: { stretch: 'horizontal' }
});
downloadPanel.add(ui.Label('Pilih Layer untuk Diunduh:', { padding: '4px' }));
downloadPanel.add(downloadSelect);
downloadPanel.add(ui.Button({
  label: 'Download GeoTIFF',
  onClick: prepareDownload,
  style: { stretch: 'horizontal', margin: '8px 0 0 0' }
}));
downloadPanel.add(ui.Button({
  label: 'Ekspor Statistik Area (CSV)',
  onClick: exportStatistics,
  style: { stretch: 'horizontal', margin: '8px 0 0 0' }
}));

function prepareDownload() {
  var sel = downloadSelect.getValue();
  var data, desc;
  downloadPanel.add(ui.Label('Mempersiapkan download...', { color: 'gray' }));

  var r = calculateFloodRisk(yearSlider.getValue(), tidalSlider.getValue(), subsidenceSlider.getValue());
  switch(sel) {
    case 'Risiko Banjir Pasang': data = r[0].clip(semarang); desc = 'Risiko_Banjir_' + yearSlider.getValue(); break;
    case 'Elevasi Daratan':      data = dem;                 desc = 'Elevasi_Daratan'; break;
    case 'Kemiringan Lereng':    data = slope;               desc = 'Kemiringan_Lereng'; break;
    case 'Penggunaan Lahan':     data = landuse;             desc = 'Penggunaan_Lahan'; break;
    case 'Jarak dari Garis Pantai': data = coastlineBuffer;  desc = 'Jarak_Pantai'; break;
    case 'Jarak dari Sungai':    data = riverBuffer;         desc = 'Jarak_Sungai'; break;
    case 'Area Tergenang':       data = r[1].lt(0).selfMask().clip(semarang); desc = 'Area_Tergenang_' + yearSlider.getValue(); break;
  }

  var url = data.getDownloadURL({ scale: 30, region: semarang.geometry(), format: 'GEO_TIFF', description: desc });
  var linkPanel = ui.Panel();
  linkPanel.add(ui.Label('Data siap diunduh:', { padding: '4px' }));
  linkPanel.add(ui.Label({ value: 'Klik untuk mengunduh', targetUrl: url, style: { color: 'blue', textDecoration: 'underline', padding: '4px' } }));
  downloadPanel.widgets().set(5, linkPanel);
}

function exportStatistics() {
  var r = calculateFloodRisk(yearSlider.getValue(), tidalSlider.getValue(), subsidenceSlider.getValue());
  var floodRisk   = r[0];
  var floodedArea = r[1].lt(0).selfMask();
  var areaImage   = ee.Image.pixelArea().divide(10000);
  var stats = [];

  for (var i = 1; i <= 5; i++) {
    var areaHa = areaImage.updateMask(floodRisk.eq(i)).reduceRegion({
      reducer: ee.Reducer.sum(), geometry: semarang.geometry(), scale: 30, maxPixels: 1e9
    });
    stats.push(ee.Feature(null, { 'Kelas_Risiko': i, 'Luas_Ha': ee.Number(areaHa.get('area')).format('%.2f') }));
  }
  var floodedHa = areaImage.updateMask(floodedArea).reduceRegion({
    reducer: ee.Reducer.sum(), geometry: semarang.geometry(), scale: 30, maxPixels: 1e9
  });
  stats.push(ee.Feature(null, { 'Kelas_Risiko': 'Tergenang', 'Luas_Ha': ee.Number(floodedHa.get('area')).format('%.2f') }));

  Export.table.toDrive({
    collection: ee.FeatureCollection(stats),
    description: 'Statistik_Risiko_Banjir_' + yearSlider.getValue(),
    fileFormat: 'CSV'
  }).start();

  downloadPanel.add(ui.Label('Ekspor CSV dimulai. Periksa panel Tasks.', { color: 'green', padding: '4px' }));
}

// ============================================================
// 12. INITIALIZE
// ============================================================
mapPanel.centerObject(semarang, 11.5);
updateFloodMap();
