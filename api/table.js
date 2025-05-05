const { createCanvas } = require('@napi-rs/canvas');

module.exports = async (req, res) => {
  // 1. Canvas ve context oluştur
  const canvas = createCanvas(300, 200);
  const ctx = canvas.getContext('2d');

  // 2. Parametreleri oku
  const params = new URLSearchParams(req.url.split('?')[1]);
  const textColor    = decodeURIComponent(params.get('_text') || '#ffffff');
  const bgColor      = params.get('_bg') || 'transparent';
  const canvasSize   = (params.get('_canvas') || '300x200').split('x').map(Number);
  const canvasWidth  = canvasSize[0];
  const canvasHeight = canvasSize[1];

  // 3. Canvas boyutunu ayarla
  canvas.width  = canvasWidth;
  canvas.height = canvasHeight;

  // 4. Arkaplan rengi uygula
  if (bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // 5. Yazı ayarları (sadece sistem fontu)
  ctx.font = '16px sans-serif';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 6. Test metni yaz
  ctx.fillText('TEST TEXT', canvasWidth / 2, 20);

  // 7. JSON verisi varsa çek
  const jsonUrl = params.get('json');
  let rows = [];

  // 8. İkon eşlemeleri
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

  // 9. JSON verisini çekmeye çalış
  if (jsonUrl) {
    try {
      console.log('Fetching JSON from:', jsonUrl);
      const response = await fetch(jsonUrl);
      if (!response.ok) throw new Error(`Failed to fetch JSON: ${response.status}`);
      const data = await response.json();
      if (!data.rows || !Array.isArray(data.rows)) throw new Error('Invalid JSON format');
      rows = data.rows;
    } catch (err) {
      return showError(`JSON error: ${err.message}`);
    }
  }

  // 10. Verileri canvas üzerine yaz (örnek amaçlı)
  rows.forEach((row, index) => {
    const text = row.text || '';
    const icon = iconMap[row.icon] || '';
    ctx.fillText(`${icon} ${text}`, canvasWidth / 2, 50 + index * 20);
  });

  // 11. PNG olarak çıktı ver
  const buffer = canvas.toBuffer('image/png');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.send(buffer);

  // Hata mesajı çizdirme fonksiyonu
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
};
