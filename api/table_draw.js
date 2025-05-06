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
    this.rows = Array.isArray(rows) && rows.length > 0 ? rows : [['Default']];
    this.canvasWidth = canvasWidth || 800;
    this.canvasHeight = canvasHeight || 400;
    this.theme = theme;
    this.shadow = shadow;
    this.radius = radius || 6;
    this.padding = 2;
    this.fontSize = fontSize || this.calculateDynamicFontSize();

    this.iconMap = icons;
    this.themes = themes;

    if (!this.theme || !this.themes[this.theme]) {
      this.theme = 'dark';
    }

    this.bgColor = bgColor === 'transparent' ? this.themes[this.theme].bgColor : bgColor;
    this.cellColor = cellColor === 'transparent' ? this.themes[this.theme].cellColor : cellColor;
    this.borderColor = borderColor === 'transparent' ? this.themes[this.theme].borderColor : borderColor;
    this.textColor = textColor === '#ff0000' ? this.themes[this.theme].textColor : textColor;

    // Column widths and row heights are calculated once during initialization
    this.columnWidths = this.calculateColumnWidths();
    this.rowHeights = this.calculateRowHeights();
    if (canvasWidth === 800 && canvasHeight === 400) {
      const { width, height } = this.calculateDynamicSize();
      this.canvasWidth = this.columnWidths.reduce((a, b) => a + b, 0);
      this.canvasHeight = this.rowHeights.reduce((a, b) => a + b, 0);
    }
  }

  calculateDynamicFontSize() {
    const rowCount = this.rows.length || 1;
    const colCount = Math.max(...(this.rows.map(row => row.length) || [1]));
    const minCellDimension = Math.min(this.canvasWidth / colCount, this.canvasHeight / rowCount);
    const baseFontSize = 12;
    const maxFontSize = 40;
    const minFontSize = 8;
    let dynamicFontSize = Math.floor(minCellDimension / 2);
    return Math.max(minFontSize, Math.min(maxFontSize, dynamicFontSize));
  }

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

  calculateColumnWidths() {
    const maxCanvasWidth = Math.max(this.canvasWidth, 200);
    const widths = [];
    this.rows.forEach(row => {
      row.forEach((cell, colIdx) => {
        const text = typeof cell === 'object' && cell !== null ? (cell.text || '') : cell;
        const iconExtra = this.iconMap[text?.match?.(/\[(\w+)\]/)?.[1]] ? 2 : 0;
        const charsPerLine = Math.floor(maxCanvasWidth / (this.fontSize * 0.6));
        const maxTextLength = charsPerLine > 0 ? Math.min(String(text).length, charsPerLine) : String(text).length;
        const width = (maxTextLength + iconExtra) * this.fontSize * 0.6 + this.padding * 1.5;
        widths[colIdx] = Math.max(widths[colIdx] || 0, width);
      });
    });
    return widths;
  }

  calculateRowHeights() {
    return this.rows.map(row => {
      let maxHeight = this.fontSize + this.padding * 2;
      const maxCanvasWidth = Math.max(this.canvasWidth, 200);
      row.forEach(cell => {
        const text = typeof cell === 'object' && cell !== null ? (cell.text || '').toString() : (cell || '').toString();
        const charsPerLine = Math.floor(maxCanvasWidth / (this.fontSize * 0.6));
        const lines = charsPerLine > 0 ? Math.ceil(text.length / charsPerLine) : 1;
        const cellHeight = (this.fontSize * lines) + this.padding * 2;
        maxHeight = Math.max(maxHeight, cellHeight);
      });
      return maxHeight;
    });
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
      padding: this.padding,
      columnWidths: this.columnWidths,
      rowHeights: this.rowHeights
    });

    return renderer.render();
  }
}

module.exports = TableDraw;