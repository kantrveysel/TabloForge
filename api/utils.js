function escapeXml(unsafe) {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  // Hata mesajı için SVG (hata ikonu ile)
  function sendError(res, width, height, message) {
    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#e05d44"/>
        <text x="${width / 2 - 20}" y="${height / 2}" fill="#ffffff" font-family="sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle">🚨</text>
        <text x="${width / 2 + 10}" y="${height / 2 + 20}" fill="#ffffff" font-family="sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle">${escapeXml(message)}</text>
      </svg>
    `;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(svgContent);
  }
  
  module.exports = { escapeXml, sendError };