// api/fromapi.js
const TableDraw = require('./table_draw');
const utils = require('./utils');

module.exports = async (req, res) => {
  const params = new URLSearchParams(req.url.split('?')[1]);
  const apiUrl = params.get('api');
  const canvasSize = (params.get('_canvas') || '800x400').split('x').map(Number);
  const canvasWidth = canvasSize[0] || 800;
  const canvasHeight = canvasSize[1] || 400;
  const theme = params.get('_theme') || '';
  const shadow = params.get('_shadow') === 'true';
  const radius = parseInt(params.get('_radius') || '0') || 0;
  const fontSize = parseInt(params.get('_size') || '12') || 12;

  let bgColor = params.get('_bg') || 'transparent';
  let cellColor = params.get('_cell') || 'transparent';
  let borderColor = params.get('_border') || 'transparent';
  let textColor = decodeURIComponent(params.get('_text') || '#ff0000');

  console.log('Parameters:', { apiUrl, canvasWidth, canvasHeight, theme, shadow, radius, fontSize, bgColor, cellColor, borderColor, textColor });

  if (!apiUrl) {
    console.log('Error: No API URL provided');
    return utils.sendError(res, canvasWidth, canvasHeight, 'API URL is required');
  }

  let rows = [];

  try {
    console.log('Fetching data from:', apiUrl);
    const response = await fetch(apiUrl);
    console.log('Fetch response status:', response.status);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();
    console.log('Fetched data:', JSON.stringify(data, null, 2));

    if (Array.isArray(data)) {
      if (data.length === 0) {
        throw new Error('API returned an empty array');
      }
      // Array durumunda, her objeyi key-value çiftlerine ayır ve her satırda key-value yapısı kullan
      rows = data.flatMap(item => {
        return Object.entries(item).map(([key, value]) => [
          { text: key },
          { text: String(value) }
        ]);
      });
    } else if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      if (keys.length === 0) {
        throw new Error('API returned an empty object');
      }
      // Obje durumunda, her key-value çiftini bir satır yap
      rows = Object.entries(data).map(([key, value]) => [
        { text: key },
        { text: String(value) }
      ]);
    } else {
      throw new Error('Unsupported data format');
    }

    console.log('Transformed rows:', JSON.stringify(rows, null, 2));

    if (!rows || rows.length === 0 || !rows.every(row => Array.isArray(row) && row.length === 2)) {
      throw new Error('Failed to process API data into table format');
    }

    console.log('Initializing TableDraw with:', { rows, canvasWidth, canvasHeight, theme, shadow, radius, fontSize, bgColor, cellColor, borderColor, textColor });
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

    console.log('Drawing SVG...');
    const svgContent = drawer.draw();

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(svgContent);
  } catch (err) {
    console.error('Error caught in fromapi.js:', err);
    return utils.sendError(res, canvasWidth, canvasHeight, `Rendering Error: ${err.message || 'Unknown error'}`);
  }
};