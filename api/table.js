const sharp = require('sharp');

module.exports = async (req, res) => {
  try {
    // Parametreleri oku
    const params = new URLSearchParams(req.url.split('?')[1]);
    const jsonUrl = params.get('json');
    const canvasSize = (params.get('_canvas') || '800x400').split('x').map(Number);
    const canvasWidth = canvasSize[0] || 800;
    const canvasHeight = canvasSize[1] || 400;
    const bgColor = params.get('_bg') || 'transparent';
    const cellColor = params.get('_cell') || 'transparent';
    const headerColor = params.get('_header') || '#4c1';
    const borderColor = params.get('_border') || 'transparent';
    const textColor = decodeURIComponent(params.get('_text') || '#ff0000');
    const fontSize = parseInt(params.get('_size') || '24') || 24;
    const shadow = params.get('_shadow') === 'true';
    const radius = parseInt(params.get('_radius') || '6') || 6;

    // Veriyi yükle
    let rows = [];
    if (jsonUrl) {
      try {
        const response = await fetch(jsonUrl);
        if (!response.ok) throw new Error(`Failed to fetch JSON: ${response.status}`);
        const data = await response.json();
        if (!data.rows || !Array.isArray(data.rows)) throw new Error('Invalid JSON: "rows" array required');
        rows = data.rows;
        console.log('Fetched rows:', rows);
      } catch (err) {
        console.error('JSON fetch failed:', err);
        return sendError(res, canvasWidth, canvasHeight, `JSON fetch failed: ${err.message}`);
      }
    } else {
      let i = 1;
      while (params.get(`r${i}`)) {
        rows.push(params.get(`r${i}`).split(','));
        i++;
      }
      console.log('Query param rows:', rows);
    }

    if (rows.length === 0) {
      return sendError(res, canvasWidth, canvasHeight, 'No data provided');
    }

    // Hücre boyutlarını hesapla
    const rowHeight = canvasHeight / rows.length;
    const colWidth = canvasWidth / rows[0].length;

    // SVG oluştur
    let svgContent = `
      <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
        <!-- Arkaplan -->
        ${bgColor !== 'transparent' ? `<rect width="${canvasWidth}" height="${canvasHeight}" fill="${bgColor}"/>` : ''}
        <!-- Test yazısı -->
        <text x="${canvasWidth / 2}" y="${canvasHeight / 4}" fill="#ff0000" font-family="sans-serif" font-size="40" text-anchor="middle" dominant-baseline="middle">TEST TEXT</text>
    `;

    // Tabloyu çiz
    rows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = colIndex * colWidth;
        const y = rowIndex * rowHeight;
        const isHeader = rowIndex === 0;
        const cellText = typeof cell === 'object' ? (cell.text || cell.toString()) : cell.toString();
        const cellBg = isHeader ? headerColor : cellColor;

        // Hücre arkaplanı
        const shadowFilter = shadow ? `filter="url(#shadow)"` : '';
        const rect = cellBg !== 'transparent' || borderColor !== 'transparent'
          ? `<rect x="${x + 2}" y="${y + 2}" width="${colWidth - 4}" height="${rowHeight - 4}" rx="${radius}" ry="${radius}" fill="${cellBg !== 'transparent' ? cellBg : 'none'}" stroke="${borderColor !== 'transparent' ? borderColor : 'none'}" stroke-width="1" ${shadowFilter}/>`
          : '';

        // Hücre metni
        const text = `<text x="${x + colWidth / 2}" y="${y + rowHeight / 2}" fill="${textColor}" font-family="sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${escapeXml(cellText)}</text>`;

        svgContent += `${rect}${text}`;
      });
    });

    // Gölge filtresi (varsa)
    if (shadow) {
      svgContent = `
        <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
              <feOffset dx="2" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.5"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          ${svgContent.slice(svgContent.indexOf('>') + 1)}
      `;
    }

    svgContent += '</svg>';

    // SVG'yi PNG'ye çevir
    const buffer = await sharp(Buffer.from(svgContent))
      .png()
      .toBuffer();

    // PNG response gönder
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(buffer);
  } catch (err) {
    console.error('General error:', err);
    return sendError(res, 800, 400, `Error: ${err.message}`);
  }
};

// Hata mesajı için SVG
function sendError(res, width, height, message) {
  const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#e05d44"/>
      <text x="${width / 2}" y="${height / 2}" fill="#ffffff" font-family="sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle">${escapeXml(message)}</text>
    </svg>
  `;
  sharp(Buffer.from(svgContent))
    .png()
    .toBuffer()
    .then(buffer => {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(buffer);
    })
    .catch(err => {
      console.error('Error rendering error SVG:', err);
      res.status(500).send('Internal Server Error');
    });
}

// XML için güvenli kaçış fonksiyonu
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
