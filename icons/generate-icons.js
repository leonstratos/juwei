// 简单的图标生成脚本 - 生成基础的 PNG 图标
const fs = require('fs');
const path = require('path');

function generateSVG(size, isMaskable = false) {
  const radius = isMaskable ? 0 : size * 0.2;
  const strokeWidth = size * 0.08;
  const crossLength = size * 0.5;
  const centerX = size / 2;
  const centerY = size / 2;
  
  return `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff758c"/>
      <stop offset="100%" style="stop-color:#ff7eb3"/>
    </linearGradient>
  </defs>
  ${isMaskable ? 
    `<rect width="${size}" height="${size}" fill="url(#grad)"/>` :
    `<rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#grad)"/>`
  }
  <line x1="${centerX}" y1="${centerY - crossLength/2}" x2="${centerX}" y2="${centerY + crossLength/2}" 
        stroke="white" stroke-width="${strokeWidth}" stroke-linecap="round"/>
  <line x1="${centerX - crossLength/2}" y1="${centerY}" x2="${centerX + crossLength/2}" y2="${centerY}" 
        stroke="white" stroke-width="${strokeWidth}" stroke-linecap="round"/>
  <circle cx="${centerX}" cy="${centerY}" r="${crossLength * 0.45}" 
          stroke="white" stroke-width="${strokeWidth * 0.6}" fill="none"/>
</svg>
  `;
}

const iconsDir = path.join(__dirname);

const sizes = [192, 512, 1024];

sizes.forEach(size => {
  const svgContent = generateSVG(size, false);
  const filename = path.join(iconsDir, `icon-${size}.svg`);
  fs.writeFileSync(filename, svgContent);
  console.log(`Generated: ${filename}`);
});

// 生成 maskable 图标
const maskableSVG = generateSVG(512, true);
fs.writeFileSync(path.join(iconsDir, 'maskable-icon-512.svg'), maskableSVG);
console.log('Generated: maskable-icon-512.svg');

console.log('\n所有图标文件已生成！');
console.log('注意：这些是 SVG 格式，您可以使用在线工具或设计软件转换为 PNG');
console.log('或者直接在浏览器中打开 ../generate-icons.html 来生成和下载 PNG 图标');
