const { createCanvas } = require('canvas');

module.exports = async (req, res) => {
  // Parse query parameters
  const params = new URLSearchParams(req.url.split('?')[1]);
  const rows = [];
  let i = 1;
  while (params.get(`r${i}`)) {
    rows.push(params.get(`r${i}`).split(','));
    i++;
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
  const borderColor = params.get('_border') || 'transparent';
  const textColor = decodeURIComponent(params.get('_text') || '#000000');
  const fontFamily = params.get('_font') || 'monospace';
  const fontSize = parseInt(params.get('_size') || '16px') || 16;
  const shadow = params.get('_shadow') === 'true';

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

  // Set font
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  if (shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }

  // Draw table
  rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = colIndex * colWidth;
      const y = rowIndex * rowHeight;

      // Draw cell background
      if (cellColor !== 'transparent') {
        ctx.fillStyle = cellColor;
        ctx.fillRect(x, y, colWidth, rowHeight);
      }

      // Draw border
      if (borderColor !== 'transparent') {
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(x, y, colWidth, rowHeight);
      }

      // Draw text
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cell, x + colWidth / 2, y + rowHeight / 2);
    });
  });

  // Send PNG response
  const buffer = canvas.toBuffer('image/png');
  res.setHeader('Content-Type', 'image/png');
  res.send(buffer);
};
