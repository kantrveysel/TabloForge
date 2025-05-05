const { createCanvas } = require('canvas');

module.exports = (req, res) => {
  const canvas = createCanvas(400, 200);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = '40px sans-serif';
  ctx.fillStyle = '#ff0000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HELLO', canvas.width / 2, canvas.height / 2);

  const buffer = canvas.toBuffer('image/png');
  res.setHeader('Content-Type', 'image/png');
  res.send(buffer);
};
