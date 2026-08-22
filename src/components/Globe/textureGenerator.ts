import * as THREE from 'three';

/**
 * Creates high-detail procedural and photorealistic canvas textures for Earth:
 * - High-Resolution NASA-style Day Color Map (Realistic Oceans, lush continents, desert ochres, mountain ranges)
 * - Bump Map (Mountain elevation reliefs: Himalayas, Andes, Alps, Rockies)
 * - Specular Map (Glossy water reflections vs matte land)
 * - Procedural Volumetric Clouds Map
 */
export function generateEarthTextures(): {
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  specularMap: THREE.CanvasTexture;
  cloudsMap: THREE.CanvasTexture;
} {
  const width = 2048;
  const height = 1024;

  // 1. Color Canvas
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext('2d')!;

  // Ocean Base - Realistic deep ocean with bathymetry & atmospheric color grading
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#7baecf'); // Polar ice ocean
  oceanGrad.addColorStop(0.12, '#38789b'); // Sub-arctic
  oceanGrad.addColorStop(0.3, '#1d5a7d'); // Temperate ocean
  oceanGrad.addColorStop(0.5, '#0e4162'); // Deep tropical ocean
  oceanGrad.addColorStop(0.7, '#1d5a7d'); // Temperate south
  oceanGrad.addColorStop(0.88, '#38789b'); // Sub-antarctic
  oceanGrad.addColorStop(1, '#7baecf'); // Antarctic
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Ocean depth ripples and gentle bathymetry currents
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  for (let i = 0; i < 50; i++) {
    ctx.beginPath();
    const y = (i / 50) * height;
    ctx.arc(width * 0.5, y, width * 0.48, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 2. Bump Canvas
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bumpCtx = bumpCanvas.getContext('2d')!;
  bumpCtx.fillStyle = '#050505'; // Ocean has 0 elevation
  bumpCtx.fillRect(0, 0, width, height);

  // 3. Specular Canvas (White = glossy water, Black = matte land)
  const specCanvas = document.createElement('canvas');
  specCanvas.width = width;
  specCanvas.height = height;
  const specCtx = specCanvas.getContext('2d')!;
  specCtx.fillStyle = '#f8f8f8'; // Ocean is highly reflective
  specCtx.fillRect(0, 0, width, height);

  // Helper to convert lat/lng to texture pixel coordinates (Equirectangular projection)
  const toXY = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  };

  // Draw landmasses with natural biomes: lush green, desert sand, and mountain bump
  function drawLandmass(
    points: [number, number][],
    landColor = '#3a6645',
    desertColor = '#a88350',
    coastalTurquoise = '#469cb0',
    hasMountains = true
  ) {
    if (points.length === 0) return;

    // Land polygon
    ctx.beginPath();
    const p0 = toXY(points[0][0], points[0][1]);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < points.length; i++) {
      const p = toXY(points[i][0], points[i][1]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();

    // Coastal shallow shelf reef turquoise edge
    ctx.strokeStyle = coastalTurquoise;
    ctx.lineWidth = 5;
    ctx.stroke();

    // Fill continent with realistic organic gradient
    const grad = ctx.createLinearGradient(p0.x, p0.y - 100, p0.x, p0.y + 200);
    grad.addColorStop(0, landColor);
    grad.addColorStop(0.6, desertColor);
    grad.addColorStop(1, landColor);
    ctx.fillStyle = grad;
    ctx.fill();

    // Specular map: Landmass is non-reflective (dark matte)
    specCtx.beginPath();
    specCtx.moveTo(p0.x, p0.y);
    for (let i = 1; i < points.length; i++) {
      const p = toXY(points[i][0], points[i][1]);
      specCtx.lineTo(p.x, p.y);
    }
    specCtx.closePath();
    specCtx.fillStyle = '#111111';
    specCtx.fill();

    // Bump map: Landmass has elevation
    bumpCtx.beginPath();
    bumpCtx.moveTo(p0.x, p0.y);
    for (let i = 1; i < points.length; i++) {
      const p = toXY(points[i][0], points[i][1]);
      bumpCtx.lineTo(p.x, p.y);
    }
    bumpCtx.closePath();
    bumpCtx.fillStyle = '#666666';
    bumpCtx.fill();

    if (hasMountains) {
      bumpCtx.strokeStyle = '#e0e0e0';
      bumpCtx.lineWidth = 9;
      bumpCtx.stroke();
    }
  }

  // --- Continents & Major Geographies (Equirectangular Lat/Lng Polygons) ---
  // North America
  drawLandmass([
    [70, -165], [72, -135], [62, -90], [55, -60], [45, -55], [30, -80], [25, -80],
    [20, -90], [15, -95], [10, -85], [15, -100], [25, -110], [35, -120], [50, -130],
    [60, -145], [65, -165]
  ], '#365e3e', '#806e46', '#4fa9bc', true);

  // South America
  drawLandmass([
    [12, -75], [5, -50], [-5, -35], [-20, -40], [-35, -55], [-55, -65], [-50, -75],
    [-35, -73], [-20, -70], [-5, -80], [5, -80]
  ], '#2c5936', '#586b3d', '#429eaf', true);

  // Eurasia (Europe + Asia)
  drawLandmass([
    [70, 30], [75, 80], [70, 140], [60, 170], [45, 140], [35, 120], [20, 110],
    [10, 105], [5, 80], [20, 70], [25, 60], [30, 45], [40, 30], [36, -5],
    [45, -10], [55, -5], [60, 10], [65, 20]
  ], '#3f5e42', '#8c7643', '#49a4b8', true);

  // Africa
  drawLandmass([
    [36, -5], [30, 32], [12, 45], [-5, 40], [-25, 33], [-35, 20], [-20, 12],
    [0, 8], [5, 0], [15, -17], [25, -15], [36, -5]
  ], '#786842', '#ad8758', '#4fa9bc', true);

  // Australia
  drawLandmass([
    [-12, 130], [-15, 145], [-25, 153], [-38, 145], [-35, 115], [-20, 115], [-12, 130]
  ], '#8c683b', '#734d28', '#459cb0', true);

  // Greenland & Arctic Ice
  drawLandmass([
    [82, -40], [72, -20], [60, -45], [75, -60], [82, -40]
  ], '#eef5f8', '#d6e5ef', '#72b6cb', false);

  // Antarctica (South polar ice cap)
  drawLandmass([
    [-70, -180], [-68, -100], [-65, 0], [-68, 100], [-70, 180], [-90, 180], [-90, -180]
  ], '#f3f8fb', '#e2edf6', '#72b6cb', false);

  // Japan Islands
  drawLandmass([[45, 142], [42, 140], [35, 135], [32, 130], [36, 138], [45, 142]], '#33593b');

  // British Isles & Scandinavia
  drawLandmass([[58, -5], [55, 0], [50, 0], [50, -5], [55, -8], [58, -5]], '#3c6340');

  // Madagascar
  drawLandmass([[-12, 49], [-16, 50], [-25, 47], [-25, 43], [-16, 44], [-12, 49]], '#385e3b');

  // Subtle Cartographic Graticule (Warm fine coordinate lines)
  ctx.strokeStyle = 'rgba(235, 210, 165, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // 4. Volumetric Procedural Cloud Map
  const cloudsCanvas = document.createElement('canvas');
  cloudsCanvas.width = width;
  cloudsCanvas.height = height;
  const cloudCtx = cloudsCanvas.getContext('2d')!;
  cloudCtx.fillStyle = 'rgba(0,0,0,0)';
  cloudCtx.clearRect(0, 0, width, height);

  // Draw swirl cloud clusters, trade wind bands, and cyclones
  const numCloudPuffs = 220;
  for (let i = 0; i < numCloudPuffs; i++) {
    const cx = Math.random() * width;
    const cy = (0.15 + Math.random() * 0.7) * height;
    const radiusX = 70 + Math.random() * 160;
    const radiusY = 22 + Math.random() * 70;
    const opacity = 0.25 + Math.random() * 0.6;

    const grad = cloudCtx.createRadialGradient(cx, cy, 0, cx, cy, radiusX);
    grad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    grad.addColorStop(0.4, `rgba(255, 255, 255, ${opacity * 0.7})`);
    grad.addColorStop(0.8, `rgba(255, 255, 255, ${opacity * 0.2})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    cloudCtx.fillStyle = grad;
    cloudCtx.beginPath();
    cloudCtx.ellipse(cx, cy, radiusX, radiusY, (Math.random() - 0.5) * 0.5, 0, Math.PI * 2);
    cloudCtx.fill();
  }

  // Create Three.js Textures
  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.ClampToEdgeWrapping;
  colorMap.generateMipmaps = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;

  const specularMap = new THREE.CanvasTexture(specCanvas);
  specularMap.wrapS = THREE.RepeatWrapping;
  specularMap.wrapT = THREE.ClampToEdgeWrapping;

  const cloudsMap = new THREE.CanvasTexture(cloudsCanvas);
  cloudsMap.wrapS = THREE.RepeatWrapping;
  cloudsMap.wrapT = THREE.ClampToEdgeWrapping;

  return {
    colorMap,
    bumpMap,
    specularMap,
    cloudsMap,
  };
}
