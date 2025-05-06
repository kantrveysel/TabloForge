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
      padding
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
    }
  
    render() {
      const rowHeight = this.canvasHeight / this.processedRows.length;
      const colWidth = this.canvasWidth / this.processedRows[0].length;
  
      let svgContent = `
        <svg width="${this.canvasWidth}" height="${this.canvasHeight}" xmlns="http://www.w3.org/2000/svg">
          ${this.bgColor !== 'transparent' ? `<rect width="${this.canvasWidth}" height="${this.canvasHeight}" fill="${this.bgColor}"/>` : ''}
      `;
  
      this.processedRows.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const x = colIndex * colWidth;
          const y = rowIndex * rowHeight;
  
          // Hücre arkaplanı
          const shadowFilter = this.shadow ? `filter="url(#shadow)"` : '';
          const rect = cell.bg !== 'transparent' || this.borderColor !== 'transparent'
            ? `<rect x="${x + this.padding}" y="${y + this.padding}" width="${colWidth - this.padding * 2}" height="${rowHeight - this.padding * 2}" rx="${this.radius}" ry="${this.radius}" fill="${cell.bg !== 'transparent' ? cell.bg : 'none'}" stroke="${this.borderColor !== 'transparent' ? this.borderColor : 'none'}" stroke-width="1" ${shadowFilter}/>`
            : '';
  
          // Hücre içeriği (ikon ve metin)
          let cellContent = '';
          let currentX = x + this.padding;
          if (cell.icon) {
            cellContent += `<text x="${currentX}" y="${y + rowHeight / 2}" fill="${this.textColor}" font-family="sans-serif" font-size="${this.fontSize}" dominant-baseline="middle">${cell.icon}</text>`;
            currentX += this.fontSize;
            if (cell.text && cell.text !== '') {
              // Kullanıcı metnin başında boşluk koyduysa boşluk ekle, yoksa ekleme
              const space = cell.text.startsWith(' ') ? this.fontSize / 2 : 0;
              cellContent += `<text x="${currentX + space}" y="${y + rowHeight / 2}" fill="${this.textColor}" font-family="sans-serif" font-size="${this.fontSize}" text-anchor="start" dominant-baseline="middle">${this.escapeXml(cell.text)}</text>`;
            }
          } else if (cell.text && cell.text !== '') {
            cellContent += `<text x="${currentX}" y="${y + rowHeight / 2}" fill="${this.textColor}" font-family="sans-serif" font-size="${this.fontSize}" text-anchor="start" dominant-baseline="middle">${this.escapeXml(cell.text)}</text>`;
          }
  
          svgContent += `${rect}${cellContent}`;
        });
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