const { createCanvas, registerFont } = require('canvas');
const path = require('path');

// Yazı tipini kaydet
try {
  const fontPath = path.join(__dirname, 'NotoSans-Regular.ttf');
  console.log('Attempting to register Noto Sans font:', fontPath);
  registerFont(fontPath, {
    family: 'Noto Sans',
    weight: '400',
    style: 'normal'
  });
  console.log('Noto Sans registered successfully');
} catch (err) {
  console.error('Font registration failed:', err.message, err.stack);
}

module.exports = async (req, res) => {
  try {
    // Canvas ve context oluştur
    const canvas = createCanvas(400, 200);
    const ctx = canvas.getContext('2d');

    // Arkaplan
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Test yazısı
    try {
      ctx.font = '40px "Noto Sans"';
      ctx.fillStyle = '#ff0000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HELLO', canvas.width / 2, canvas.height / 2);
      console.log('Text "HELLO" rendered with font: 40px Noto Sans');
    } catch (err) {
      console.error('Text render failed:', err.message, err.stack);
      ctx.fillStyle = '#e05d44';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px sans-serif'; // Fallback font
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Error: ' + err.message, canvas.width / 2, canvas.height / 2, canvas.width - 20);
    }

    // PNG response gönder
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(buffer);
  } catch (err) {
    console.error('General error:', err.message, err.stack);
    const canvas = createCanvas(400, 200);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e05d44';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif'; // Fallback font
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
