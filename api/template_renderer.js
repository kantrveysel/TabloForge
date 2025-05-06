// api/template_renderer.js
class TemplateRenderer {
  constructor({
    processedRows,
    canvasWidth,
    canvasHeight,
    fontSize,
    bgColor,
    borderColor,
    textColor,
    shadow,
    radius,
    padding,
    columnWidths,
    rowHeights
  }) {
    this.processedRows = processedRows;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.fontSize = fontSize;
    this.bgColor = bgColor;
    this.borderColor = borderColor;
    this.textColor = textColor;
    this.shadow = shadow;
    this.radius = radius;
    this.padding = padding;
    this.columnWidths = columnWidths;
    this.rowHeights = rowHeights;
  }

  render() {
    let svgContent = `
      <svg width="${this.canvasWidth}" height="${this.canvasHeight}" xmlns="http://www.w3.org/2000/svg">
        ${this.bgColor !== 'transparent' ? `<rect width="${this.canvasWidth}" height="${this.canvasHeight}" fill="${this.bgColor}"/>` : ''}
    `;

    let y = 0;

    this.processedRows.forEach((row, rowIndex) => {
      const rowHeight = this.rowHeights[rowIndex] || 40;
      let x = 0;

      row.forEach((cell, colIndex) => {
        const colWidth = this.columnWidths[colIndex] || 100;

        // Hücre arkaplanı
        const shadowFilter = this.shadow ? `filter="url(#shadow)"` : '';
        const rect = cell.bg !== 'transparent' || this.borderColor !== 'transparent'
          ? `<rect x="${x + this.padding}" y="${y + this.padding}" width="${colWidth - this.padding * 2}" height="${rowHeight - this.padding * 2}" rx="${this.radius}" ry="${this.radius}" fill="${cell.bg !== 'transparent' ? cell.bg : 'none'}" stroke="${this.borderColor !== 'transparent' ? this.borderColor : 'none'}" stroke-width="1" ${shadowFilter}/>`
          : '';

        // Hücre içeriği (metin sarması ile)
        let cellContent = '';
        let currentX = x + this.padding;
        if (cell.icon) {
          cellContent += `<text x="${currentX}" y="${y + rowHeight / 2}" fill="${this.textColor}" font-family="sans-serif" font-size="${this.fontSize}" dominant-baseline="middle">${cell.icon}</text>`;
          currentX += this.fontSize;
          if (cell.text && cell.text !== '') {
            const space = cell.text.startsWith(' ') ? this.fontSize / 2 : 0;
            cellContent += this.renderWrappedText(cell.text, currentX + space, y, colWidth - currentX - this.padding, rowHeight);
          }
        } else if (cell.text && cell.text !== '') {
          cellContent += this.renderWrappedText(cell.text, currentX, y, colWidth - this.padding * 2, rowHeight);
        }

        svgContent += `${rect}${cellContent}`;
        x += colWidth;
      });

      y += rowHeight;
    });

    if (this.shadow) {
      svgContent = `
        <svg width="${this.canvasWidth}" height="${this.canvasHeight}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
              <feOffset dx="2" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.5"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          ${svgContent.slice(svgContent.indexOf('>') + 1)}
      `;
    }

    svgContent += '</svg>';
    return svgContent;
  }

  renderWrappedText(text, x, y, maxWidth, maxHeight) {
    const charsPerLine = Math.floor(maxWidth / (this.fontSize * 0.6));
    if (charsPerLine <= 0) return ''; // Çok küçük alan, metni render etme

    const words = text.split(' ');
    let lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine.length + word.length + 1) <= charsPerLine) { // +1 boşluk için
        currentLine += (currentLine.length > 0 ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Satır sayısını maxHeight'e göre sınırla
    const maxLines = Math.floor(maxHeight / this.fontSize);
    lines = lines.slice(0, maxLines);

    const tspans = lines.map((line, i) => {
      const dy = i === 0 ? this.fontSize : this.fontSize;
      const adjustedY = y + (i * this.fontSize) + (this.fontSize / 2); // Dikey ortalamayı koru
      return `<tspan x="${x}" y="${adjustedY}" fill="${this.textColor}" font-family="sans-serif" font-size="${this.fontSize}" text-anchor="start" dominant-baseline="middle">${this.escapeXml(line)}</tspan>`;
    }).join('');

    return `<text>${tspans}</text>`;
  }

  escapeXml(unsafe) {
    return unsafe
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, "'");
  }
}

module.exports = TemplateRenderer;