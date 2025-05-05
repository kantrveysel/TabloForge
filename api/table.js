module.exports = async (req, res) => {
  try {
    // İkon haritası
    const iconMap = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️',
      'star': '⭐',
      'check': '✔️',
      'cross': '✖️',
      'green dot': '🟢',
      'red dot': '🔴',
      'offline': '⛔'
    };

    // Tema seçenekleri
    const themes = {
      'dark': {
        bgColor: '#1a1a1a',
        cellColor: '#333333',
        headerColor: '#4a4a4a',
        borderColor: '#666666',
        textColor: '#ffffff'
      },
      'light': {
        bgColor: '#ffffff',
        cellColor: '#f0f0f0',
        headerColor: '#d0d0d0',
        borderColor: '#999999',
        textColor: '#000000'
      },
      'ocean': {
        bgColor: '#1e3a8a',
        cellColor: '#3b82f6',
        headerColor: '#60a5fa',
        borderColor: '#93c5fd',
        textColor: '#e0f2fe'
      }
    };

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
    let headerColor = params.get('_header') || '#4c1';
    let borderColor = params.get('_border') || 'transparent';
    let textColor = decodeURIComponent(params.get('_text') || '#ff0000');

    // Tema uygula (parametreler override eder)
    if (themes[theme]) {
      bgColor = params.get('_bg') || themes[theme].bgColor;
      cellColor = params.get('_cell') || themes[theme].cellColor;
      headerColor = params.get('_header') || themes[theme].headerColor;
      borderColor = params.get('_border') || themes[theme].borderColor;
      textColor = decodeURIComponent(params.get('_text') || themes[theme].textColor);
    }

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
        <text x="${canvasWidth / 2}" y="${canvasHeight / 4}" fill="${textColor}" font-family="sans-serif" font-size="40" text-anchor="middle" dominant-baseline="middle">TEST TEXT</text>
    `;

    // Tabloyu çiz
    rows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = colIndex * colWidth;
        const y = rowIndex * rowHeight;
        const isHeader = rowIndex === 0;
        let cellText = '';
        let cellIcon = '';
        let cellBg = isHeader ? headerColor : cellColor;

        // Hücre verisini parse et
        if (typeof cell === 'object') {
          cellText = cell.text || cell.toString();
          if (cell.icon && iconMap[cell.icon]) {
            cellIcon = iconMap[cell.icon];
          }
          if (cell.color) {
            cellBg = cell.color;
          }
        } else {
          cellText = cell.toString();
          // [icon] formatını kontrol et
          const iconMatch = cellText.match(/\[(\w+)\]/);
          if (iconMatch && iconMap[iconMatch[1]]) {
            cellIcon = iconMap[iconMatch[1]];
            cellText = cellText.replace(iconMatch[0], '').trim();
          }
        }

        // Hücre arkaplanı
        const shadowFilter = shadow ? `filter="url(#shadow)"` : '';
        const rect = cellBg !== 'transparent' || borderColor !== 'transparent'
          ? `<rect x="${x + 2}" y="${y + 2}" width="${colWidth - 4}" height="${rowHeight - 4}" rx="${radius}" ry="${radius}" fill="${cellBg !== 'transparent' ? cellBg : 'none'}" stroke="${borderColor !== 'transparent' ? borderColor : 'none'}" stroke-width="1" ${shadowFilter}/>`
          : '';

        // Hücre içeriği (ikon ve metin)
        let cellContent = '';
        if (cellIcon) {
          // İkon ve metni yan yana yerleştir
          cellContent += `<text x="${x + colWidth / 2 - fontSize}" y="${y + rowHeight / 2}" fill="${textColor}" font-family="sans-serif" font-size="${fontSize}" text-anchor="end" dominant-baseline="middle">${cellIcon}</text>`;
        }
        cellContent += `<text x="${x + colWidth / 2 + (cellIcon ? fontSize / 2 : 0)}" y="${y + rowHeight / 2}" fill="${textColor}" font-family="sans-serif" font-size="${fontSize}" text-anchor="${cellIcon ? 'start' : 'middle'}" dominant-baseline="middle">${escapeXml(cellText)}</text>`;

        svgContent += `${rect}${cellContent}`;
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

    // SVG response gönder
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(svgContent);
  } catch (err) {
    console.error('General error:', err);
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
