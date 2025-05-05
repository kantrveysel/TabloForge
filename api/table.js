// api/table.js
const { createCanvas } = require('@napi-rs/canvas');
const fetch = require('node-fetch');  // Node.js ortamında fetch gerekir

module.exports = async (req, res) => {
  try {
    // ─── 1) PARAMETRELERİ OKU ──────────────────────────────────────────────
    const params = new URLSearchParams(req.url.split('?')[1]);
    const canvasSize = (params.get('_canvas') || '300x200').split('x').map(Number);
    const canvasWidth  = canvasSize[0];
    const canvasHeight = canvasSize[1];
    const bgColor    = params.get('_bg')     || 'transparent';
    const cellColor  = params.get('_cell')   || 'transparent';
    const headerColor= params.get('_header') || '#4c1';
    const borderColor= params.get('_border') || 'transparent';
    const textColor  = decodeURIComponent(params.get('_text') || '#00ff00');  // yeşil
    const fontSize   = parseInt(params.get('_size') || '20', 10);
    const shadow     = params.get('_shadow') === 'true';
    
    // ─── 2) CANVAS HAZIRLA ─────────────────────────────────────────────────
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx    = canvas.getContext('2d');
    
    // Arkaplan
    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    
    // ─── 3) VERİYİ YÜKLE ─────────────────────────────────────────────────
    let rows = [];
    if (params.get('json')) {
      // JSON endpoint'ten çek
      const url = params.get('json');
      const r = await fetch(url);
      if (!r.ok) throw new Error(`JSON fetch ${r.status}`);
      const j = await r.json();
      if (!Array.isArray(j.rows)) throw new Error(`Invalid JSON`);
      rows = j.rows;
    } else {
      // r1=..., r2=... parametrelerinden oku
      let i = 1;
      while (params.get(`r${i}`)) {
        rows.push(params.get(`r${i}`).split(','));
        i++;
      }
    }
    if (!rows.length) throw new Error('No data provided');
    
    // Hücre boyutları
    const rowH = canvasHeight / rows.length;
    const colW = canvasWidth  / rows[0].length;
    
    // ─── 4) METİN AYARLARI ────────────────────────────────────────────────
    ctx.font         = `${fontSize}px sans-serif`;
    ctx.fillStyle    = textColor;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    if (shadow) {
      ctx.shadowColor   = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur    = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }
    
    // ─── 5) TABLOYU ÇİZ ───────────────────────────────────────────────────
    rows.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        const x = ci * colW;
        const y = ri * rowH;
        const isHeader = ri === 0;
        
        // Hücre arkası
        const fillBg = isHeader ? headerColor : cellColor;
        if (fillBg !== 'transparent') {
          ctx.fillStyle = fillBg;
          ctx.fillRect(x, y, colW, rowH);
        }
        
        // Kenarlık
        if (borderColor !== 'transparent') {
          ctx.strokeStyle = borderColor;
          ctx.strokeRect(x, y, colW, rowH);
        }
        
        // Metni çiz
        ctx.fillStyle = textColor;
        ctx.fillText(cell, x + colW/2, y + rowH/2);
      });
    });
    
    // ─── 6) PNG OLARAK GÖNDER ─────────────────────────────────────────────
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.send(buffer);
    
  } catch (err) {
    // Hata durumunda basit bir error image üret
    const canvas = createCanvas(300, 100);
    const ctx    = canvas.getContext('2d');
    ctx.fillStyle = '#e05d44';
    ctx.fillRect(0,0,300,100);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Error: '+err.message,150,50);
    const buf = canvas.toBuffer('image/png');
    res.setHeader('Content-Type','image/png');
    return res.send(buf);
  }
};
