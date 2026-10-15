const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

function extractBetween(startStr, endStr, searchFrom = 0) {
  const start = html.indexOf(startStr, searchFrom);
  if (start === -1) return null;
  const actualStart = start + startStr.length;
  const end = html.indexOf(endStr, actualStart);
  if (end === -1) return null;
  return html.substring(actualStart, end);
}

// 1. cloud-oren
const orenUrl = extractBetween('.cloud-oren', 'background-image: url("data:image/svg+xml,');
if (orenUrl !== null) {
  const orenSvgRaw = extractBetween('background-image: url("data:image/svg+xml,', '");', html.indexOf('.cloud-oren'));
  if (orenSvgRaw) {
    const orenSvg = decodeURIComponent(orenSvgRaw);
    fs.writeFileSync('public/images/cloud-oren.svg', orenSvg);
    console.log('Successfully saved public/images/cloud-oren.svg, bytes:', orenSvg.length);
  }
}

// 2. cloud-ijo
const ijoPos = html.indexOf('.cloud-ijo');
if (ijoPos !== -1) {
  const ijoSvgRaw = extractBetween('background-image: url("data:image/svg+xml,', '");', ijoPos);
  if (ijoSvgRaw) {
    const ijoSvg = decodeURIComponent(ijoSvgRaw);
    fs.writeFileSync('public/images/cloud-ijo.svg', ijoSvg);
    console.log('Successfully saved public/images/cloud-ijo.svg, bytes:', ijoSvg.length);
  }
}

// 3. Requirements: ico-oren
const icoOrenPos = html.indexOf('.bbox .ico-oren');
if (icoOrenPos !== -1) {
  const raw = extractBetween('background-image: url("data:image/svg+xml,', '");', icoOrenPos);
  if (raw) {
    const svg = decodeURIComponent(raw);
    fs.writeFileSync('public/images/ico-oren.svg', svg);
    console.log('Successfully saved public/images/ico-oren.svg, bytes:', svg.length);
  }
}

// 4. Requirements: ico-ijo
const icoIjoPos = html.indexOf('.bbox .ico-ijo');
if (icoIjoPos !== -1) {
  // note: ico-ijo in index.html has single quote: url('data:image/svg+xml,
  let raw = extractBetween("background-image: url('data:image/svg+xml,", "');", icoIjoPos);
  if (!raw) raw = extractBetween('background-image: url("data:image/svg+xml,', '");', icoIjoPos);
  if (raw) {
    const svg = decodeURIComponent(raw);
    fs.writeFileSync('public/images/ico-ijo.svg', svg);
    console.log('Successfully saved public/images/ico-ijo.svg, bytes:', svg.length);
  }
}

// 5. Requirements: text-oren
const textOrenPos = html.indexOf('.bbox .text-oren');
if (textOrenPos !== -1) {
  const raw = extractBetween('background-image: url("data:image/svg+xml,', '");', textOrenPos);
  if (raw) {
    const svg = decodeURIComponent(raw);
    fs.writeFileSync('public/images/text-oren.svg', svg);
    console.log('Successfully saved public/images/text-oren.svg, bytes:', svg.length);
  }
}

// 6. Requirements: text-ijo
const textIjoPos = html.indexOf('.bbox .text-ijo');
if (textIjoPos !== -1) {
  let raw = extractBetween("background-image: url('data:image/svg+xml,", "');", textIjoPos);
  if (!raw) raw = extractBetween('background-image: url("data:image/svg+xml,', '");', textIjoPos);
  if (raw) {
    const svg = decodeURIComponent(raw);
    fs.writeFileSync('public/images/text-ijo.svg', svg);
    console.log('Successfully saved public/images/text-ijo.svg, bytes:', svg.length);
  }
}
