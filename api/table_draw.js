// api/table_draw.js
const DataParser = require('./data_parser');
const TemplateRenderer = require('./template_renderer');
const icons = require('./config/icons');
const themes = require('./config/themes');

class TableDraw {
  constructor({
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
  }) {
    // rows kontrolü
    this.rows = Array.isArray(rows) && rows.length > 0 ? rows : [['Default']]; // Boşsa varsayılan bir satır ekle
    this.canvasWidth = canvasWidth || 800; // Varsayılan canvas genişliği
    this.canvasHeight = canvasHeight || 400; // Varsayılan canvas yüksekliği
    this.theme = theme;
    this.shadow = shadow;
    this.radius = radius || 6;
    this.padding = 2;

    // Varsayılan fontSize, dinamik olarak ayarlanacak
    this.fontSize = fontSize || this.calculateDynamicFontSize();

    // Tema ve ikonlar (ayrı dosyalardan çekildi)
    this.iconMap = icons;
    this.themes = themes;

    // Tema yoksa varsayılan dark tema uygula
    if (!this.theme || !this.themes[this.theme]) {
      this.theme = 'dark';
    }

    // Tema uygula (parametreler override eder)
    this.bgColor = bgColor === 'transparent' ? this.themes[this.theme].bgColor : bgColor;
    this.cellColor = cellColor === 'transparent' ? this.themes[this.theme].cellColor : cellColor;
    this.borderColor = borderColor === 'transparent' ? this.themes[this.theme].borderColor : borderColor;
    this.textColor = textColor === '#ff0000' ? this.themes[this.theme].textColor : textColor;

    // Dinamik boyut hesaplama (eğer kullanıcı belirtmediyse)
    if (canvasWidth === 800 && canvasHeight === 400) {
      const { width, height } = this.calculateDynamicSize();
      this.canvasWidth = width;
      this.canvasHeight = height;
    }
  }

  // Dinamik fontSize hesaplama (güvenli hale getirildi)
  calculateDynamicFontSize() {
    // rows boşsa veya undefined ise varsayılan değerler kullan
    const rowCount = this.rows.length || 1;
    const colCount = Math.max(...(this.rows.map(row => row.length) || [1]));
    const minCellDimension = Math.min(this.canvasWidth / colCount, this.canvasHeight / rowCount);

    const baseFontSize = 12;
    const maxFontSize = 40;
    const minFontSize = 8;

    let dynamicFontSize = Math.floor(minCellDimension / 2); // Hücre boyutunun yarısı
    dynamicFontSize = Math.max(minFontSize, Math.min(maxFontSize, dynamicFontSize)); // Sınırları kontrol et
    return dynamicFontSize;
  }

  // Dinamik boyut hesaplama (güvenli hale getirildi)
  calculateDynamicSize() {
    const rowCount = this.rows.length || 1;
    const colCount = Math.max(...(this.rows.map(row => row.length) || [1]));
    const maxTextLength = Math.max(...(this.rows.flat().map(cell => {
      const text = typeof cell === 'object' && cell !== null ? (cell.text || '').toString() : (cell || '').toString();
      return text.length + (this.iconMap[text.match(/\[(\w+)\]/)?.[1]] ? 2 : 0);
    }) || [1]));

    const cellWidth = (maxTextLength * this.fontSize * 0.6) + (this.padding * 2);
    const cellHeight = this.fontSize + (this.padding * 2);

    return {
      width: colCount * cellWidth,
      height: rowCount * cellHeight
    };
  }

  draw() {
    const parser = new DataParser(this.iconMap);
    const processedRows = parser.parseRows(this.rows);

    const renderer = new TemplateRenderer({
      processedRows,
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
      fontSize: this.fontSize,
      bgColor: this.bgColor,
      borderColor: this.borderColor,
      textColor: this.textColor,
      shadow: this.shadow,
      radius: this.radius,
      padding: this.padding
    });

    return renderer.render();
  }
}

module.exports = TableDraw;