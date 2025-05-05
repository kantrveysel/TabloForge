const { createCanvas, registerFont } = require('@napi-rs/canvas');
const path = require('path');

module.exports = async (req, res) => {
  const canvas = createCanvas(300, 200); // Default size for error cases
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

  // Register fonts
  try {
    console.log('Registering DejaVu Sans font:', path.join(__dirname, 'fonts', 'DejaVuSans.ttf'));
    registerFont(path.join(__dirname, 'fonts', 'DejaVuSans.ttf'), { family: 'DejaVu Sans' });
    console.log('Registering Roboto font:', path.join(__dirname, 'fonts', 'Roboto-Regular.ttf'));
    registerFont(path.join(__dirname, 'fonts', 'Roboto-Regular.ttf'), { family: 'Roboto' });
    console.log('Registering Noto Color Emoji font:', path.join(__dirname, 'fonts', 'NotoColorEmoji.ttf'));
    registerFont(path.join(__dirname, 'fonts', 'NotoColorEmoji.ttf'), { family: 'Noto Color Emoji' });
    console.log('Fonts registered successfully');
  } catch (err) {
    console.error('Font registration failed:', err);
    return showError(`Font registration failed: ${err.message}`);
  }

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
      console.log('Fetching JSON from:', jsonUrl);
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

  // Canvas setup from query params
  const canvasSize = (params.get('_canvas') || '300x200').split('x');
  const canvasWidth = parseInt(canvasSize[0]) || 300;
  const canvasHeight = parseInt(canvasSize[1]) || 200;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const bgColor = params.get('_bg') || 'transparent';
  const cellColor = params.get('_cell') || 'transparent';
  const headerColor = params.get('_header') || '#4c1';
  const borderColor = params.get('_border') || 'transparent';
  const textColor = decodeURIComponent(params.get('_text') || '#ffffff');
  const fontFamily = params.get('_font') || 'sans-serif';
  const fontSize = parseInt(params.get('_size') || '20') || 20;
  const shadow = params.get('_shadow') === 'true';
  const radius = parseInt(params.get('_radius') || '6') || 6;

  // Set background
  if (bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // Test text rendering
  console.log('Testing text render with font:', `30px sans-serif`);
  ctx.font = '30px sans-serif';
  ctx.fillStyle = '#ff0000'; // Red for visibility
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TEST TEXT', canvasWidth / 2, 30);
  console.log('Test text rendered');

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
  try {
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

        // Set font (use sans-serif as fallback)
        const font = cellIcon ? `${fontSize}px Noto Color Emoji, sans-serif` : `${fontSize}px sans-serif`;
        console.log(`Setting font for cell (${rowIndex}, ${colIndex}):`, font);
        ctx.font = font;
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
        console.log(`Rendering text for cell (${rowIndex}, ${colIndex}):`, displayText);
        ctx.fillText(displayText, x + colWidth / 2, y + rowHeight / 2);
      });
    });
  } catch (err) {
    console.error('Table rendering failed:', err);
    return showError(`Table rendering failed: ${err.message}`);
  }

  // Send PNG response
  const buffer = canvas.toBuffer('image/png');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.send(buffer);
};
