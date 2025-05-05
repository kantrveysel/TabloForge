const { createCanvas, registerFont } = require('@napi-rs/canvas');
const path = require('path');

// Register fonts
try {
  registerFont(path.join(__dirname, 'fonts', 'ARIAL.TTF'), { family: 'Arial' });
  registerFont(path.join(__dirname, 'fonts', 'NotoColorEmoji.ttf'), { family: 'Noto Color Emoji' });
} catch (err) {
  console.error('Font registration failed:', err);
}

module.exports = async (req, res) => {
  // Parse query parameters
  const params = new URLSearchParams(req.url.split('?')[1]);
  const jsonUrl = params.get('json');
  let rows = [];

  // Icon mapping
  const iconMap = {
    'star': '⭐',
    'check': '✅',
    'rocket': '🚀',
    'heart': '❤️',
    'fire': '🔥',
    'user': '👤',
    'clock': '⏰',
    'thumb': '👍',
    'offline': '🔴',
    'red dot': '🔴',
    'green dot': '🟢',
    'waiting': '⏳'
  };

  // Load data from query params or JSON
  if (jsonUrl) {
    try {
      const response = await fetch(jsonUrl);
      if (!response.ok) throw new Error(`Failed to fetch JSON: ${response.status}`);
      const data = await response.json();
      if (!data.rows || !Array.isArray(data.rows)) throw new Error('Invalid JSON: "rows" array required');
      rows = data.rows;
    } catch (err) {
      res.status(400).send(`Error: ${err.message}`);
      return;
    }
  } else {
    let i = 1;
    while (params.get(`r${i}`)) {
      rows.push(params.get(`r${i}`).split(','));
      i++;
    }
  }

  if (rows.length === 0) {
    res.status(400).send('No data provided');
    return;
  }

  // Canvas setup from query params
  const canvasSize = (params.get('_canvas') || '200x100').split('x');
  const canvasWidth = parseInt(canvasSize[0]) || 200;
  const canvasHeight = parseInt(canvasSize[1]) || 100;
  const bgColor = params.get('_bg') || 'transparent';
  const cellColor = params.get('_cell') || 'transparent';
  const headerColor = params.get('_header') || '#4c1';
  const borderColor = params.get('_border') || 'transparent';
  const textColor = decodeURIComponent(params.get('_text') || '#000000');
  const fontFamily = params.get('_font') || 'Arial';
  const fontSize = parseInt(params.get('_size') || '16') || 16;
  const shadow = params.get('_shadow') === 'true';
  const radius = parseInt(params.get('_radius') || '6') || 6;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // Set background
  if (bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // Calculate cell dimensions
  const rowHeight = canvasHeight / rows.length;
  const colWidth = canvasWidth / rows[0].length;

  // Rounded rectangle for cells
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

  // Draw table
  rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = colIndex * colWidth;
      const y = rowIndex * rowHeight;
      const isHeader = rowIndex === 0;

      // Parse cell data (support JSON-like objects from JSON input)
      let cellData = typeof cell === 'object' ? cell : { text: cell };
      const cellText = cellData.text || cell.toString();
      const cellIcon = cellData.icon ? iconMap[cellData.icon] || '' : '';
      const cellBg = cellData.color || (isHeader ? headerColor : cellColor);

      // Set font (use Noto Color Emoji for icons, Arial for text)
      ctx.font = cellIcon ? `${fontSize}px Noto Color Emoji, Arial` : `${fontSize}px Arial`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Apply shadow
      if (shadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      } else {
        ctx.shadowColor = 'transparent';
      }

      // Draw cell background
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

      // Draw border
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

      // Draw text with icon
      const displayText = cellIcon ? `${cellIcon} ${cellText}` : cellText;
      ctx.fillText(displayText, x + colWidth / 2, y + rowHeight / 2);
    });
  });

  // Send PNG response
  const buffer = canvas.toBuffer('image/png');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.send(buffer);
};
