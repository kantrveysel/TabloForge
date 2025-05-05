const { createCanvas } = require('@napi-rs/canvas');

module.exports = async (req, res) => {
  try {
    // Canvas ve context oluştur
    const canvas = createCanvas(300, 200);
    const ctx = canvas.getContext('2d');

    // Error rendering function
    function showError(message) {
      ctx.fillStyle = '#e05d44';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Error: ' + message, canvas.width / 2, canvas.height / 2, canvas.width - 20);
      const buffer = canvas.toBuffer('image/png');
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(buffer);
    }

    // Parametreleri oku
    const params = new URLSearchParams(req.url.split('?')[1]);
    const jsonUrl = params.get('json');
    const canvasSize = (params.get('_canvas') || '300x200').split('x').map(Number);
    const canvasWidth = canvasSize[0] || 300;
    const canvasHeight = canvasSize[1] || 200;
    const bgColor = params.get('_bg') || 'transparent';
    const cellColor = params.get('_cell') || 'transparent';
    const headerColor = params.get('_header') || '#4c1';
    const borderColor = params.get('_border') || 'transparent';
    const textColor = decodeURIComponent(params.get('_text') || '#ffffff');
    const fontSize = parseInt(params.get('_size') || '40') || 40;
    const shadow = params.get('_shadow') === 'true';
    const radius = parseInt(params.get('_radius') || '6') || 6;

    // Canvas boyutunu güncelle
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Arkaplanı uygula
    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Test yazısı
    ctx.font = '40px sans-serif, monospace, arial';
    ctx.fillStyle = '#ff0000'; // Kırmızı, görünür olsun
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TEST TEXT', canvasWidth / 2, 40);
    console.log('Test text rendered with font: 40px sans-serif, monospace, arial');

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
        return showError(`JSON fetch failed: ${err.message}`);
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
      return showError('No data provided');
    }

    // Hücre boyutlarını hesapla
    const rowHeight = canvasHeight / rows.length;
    const colWidth = canvasWidth / rows[0].length;

    // Yuvarlak dikdörtgen fonksiyonu
    function roundRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    // Tabloyu çiz
    rows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = colIndex * colWidth;
        const y = rowIndex * rowHeight;
        const isHeader = rowIndex === 0;

        // Hücre verisini parse et (sadece metin)
        const cellText = typeof cell === 'object' ? (cell.text || cell.toString()) : cell.toString();
        const cellBg = isHeader ? headerColor : cellColor;

        // Font ve yazı ayarları
        ctx.font = `${fontSize}px sans-serif, monospace, arial`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        console.log(`Rendering text for cell (${rowIndex}, ${colIndex}): ${cellText}`);

        // Gölge uygula
        if (shadow) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
        } else {
          ctx.shadowColor = 'transparent';
        }

        // Hücre arkaplanını çiz
        if (cellBg !== 'transparent') {
          if (radius > 0) {
            roundRect(ctx, x + 2, y + 2, colWidth - 4, rowHeight - 4, radius);
            ctx.fillStyle = cellBg;
            ctx.fill();
          } else {
            ctx.fillStyle = cellBg;
            ctx.fillRect(x + 2, y + 2, colWidth - 4, rowHeight - 4);
          }
        }

        // Kenarlık çiz
        if (borderColor !== 'transparent') {
          if (radius > 0) {
            roundRect(ctx, x + 2, y + 2, colWidth - 4, rowHeight - 4, radius);
            ctx.strokeStyle = borderColor;
            ctx.stroke();
          } else {
            ctx.strokeStyle = borderColor;
            ctx.strokeRect(x + 2, y + 2, colWidth - 4, rowHeight - 4);
          }
        }

        // Metni çiz
        ctx.fillText(cellText, x + colWidth / 2, y + rowHeight / 2);
      });
    });

    // PNG response gönder
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(buffer);
  } catch (err) {
    // Genel hata yakalama
    console.error('General error:', err);
    const canvas = createCanvas(300, 200);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e05d44';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Error: ' + err.message, canvas.width / 2, canvas.height / 2, canvas.width - 20);
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(buffer);
  }
};
