// api/data_parser.js
class DataParser {
    constructor(iconMap) {
      this.iconMap = iconMap;
    }
  
    parseRows(rows) {
      return rows.map(row => {
        return row.map(cell => {
          let cellText = '';
          let cellIcon = '';
          let cellBg = 'transparent'; // Varsayılan hücre rengi
  
          if (typeof cell === 'object' && cell !== null) {
            cellText = cell.text ? cell.text.toString() : '';
            if (cell.icon && this.iconMap[cell.icon]) {
              cellIcon = this.iconMap[cell.icon];
            }
            if (cell.color) {
              cellBg = cell.color;
            }
          } else {
            cellText = cell ? cell.toString() : '';
            const iconMatch = cellText.match(/\[(\w+)\]/);
            if (iconMatch && this.iconMap[iconMatch[1]]) {
              cellIcon = this.iconMap[iconMatch[1]];
              cellText = cellText.replace(iconMatch[0], '').trim();
            }
          }
  
          return { text: cellText, icon: cellIcon, bg: cellBg };
        });
      });
    }
  }
  
  module.exports = DataParser;