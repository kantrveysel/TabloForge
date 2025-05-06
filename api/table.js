// api/table.js
const TableDraw = require('./table_draw');

module.exports = async (req, res) => {
  try {
    // Parametreleri oku
    const params = new URLSearchParams(req.url.split('?')[1]);
    const jsonUrl = params.get('json');
    const canvasSize = (params.get('_canvas') || '800x400').split('x').map(Number);
    const canvasWidth = canvasSize[0] || 800;
    const canvasHeight = canvasSize[1] || 400;
    const theme = params.get('_theme') || '';
    const shadow = params.get('_shadow') === 'true';
    const radius = parseInt(params.get('_radius') || '6') || 6;
    const fontSize = parseInt(params.get('_size') || '24') || 24;

    // Tema parametrelerini al veya varsayılan değerleri kullan
    let bgColor = params.get('_bg') || 'transparent';
    let cellColor = params.get('_cell') || 'transparent';
    let borderColor = params.get('_border') || 'transparent';
    let textColor = decodeURIComponent(params.get('_text') || '#ff0000');

    // Veriyi yükle
    let rows = [];
    if (jsonUrl) {
      try {
        const response = await fetch(jsonUrl);
        if (!response.ok) throw new Error(`Failed to fetch JSON: ${response.status}`);
        const data = await response.json();
        if (!data.rows || !Array.isArray(data.rows)) throw new Error('Invalid JSON: "rows" array required');
        rows = data.rows;
      } catch (err) {
        return sendError(res, canvasWidth, canvasHeight, `JSON fetch failed: ${err.message}`);
      }
    } else {
      let i = 1;
      while (params.get(`r${i}`)) {
        rows.push(params.get(`r${i}`).split(','));
        i++;
      }
    }

    if (rows.length === 0) {
      return sendError(res, canvasWidth, canvasHeight, 'No data provided');
    }

    // TableDraw sınıfını başlat ve çizimi yaptır
    const drawer = new TableDraw({
      rows,
      canvasWidth,
      canvasHeight,
      theme,
      shadow,
      radius,
      fontSize,
      bgColor,
      cellColor,
      borderColor,
      textColor
    });

    const svgContent = drawer.draw();

    // SVG response gönder
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(svgContent);
  } catch (err) {
    return sendError(res, 800, 400, `Error: ${err.message}`);
  }
};

// Hata mesajı için SVG (hata ikonu ile)
function sendError(res, width, height, message) {
  const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#e05d44"/>
      <text x="${width / 2 - 20}" y="${height / 2}" fill="#ffffff" font-family="sans-serif" font-size="16" text-anchor="end" dominant-baseline="middle">🚨</text>
      <text x="${width / 2 + 10}" y="${height / 2}" fill="#ffffff" font-family="sans-serif" font-size="16" text-anchor="start" dominant-baseline="middle">${escapeXml(message)}</text>
    </svg>
  `;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.send(svgContent);
}

// XML için güvenli kaçış fonksiyonu
function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'");
}