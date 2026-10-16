const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../src/web/node_modules/playwright');

const root = __dirname;
const project = path.resolve(root, '..');
const docs = [
  ['FINAL_REPORT.md', 'Detailed NFR Test Report'],
  ['TEST_PLAN.md', 'NFR Test Plan'],
  ['RUN_GUIDE.md', 'NFR Test Run Guide'],
  ['FLUTTER_TEST_REPORT.md', 'Flutter Test Report'],
];

function esc(s) {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function inline(s) {
  let out = esc(s);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

function renderMarkdown(md) {
  const lines = md.replace(/^\uFEFF/, '').split(/\r?\n/);
  const out = [];
  let para = [], list = null, code = false, codeLines = [], table = false;
  const flushPara = () => { if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`); para = []; };
  const flushList = () => { if (list) out.push(`</${list}>`); list = null; };
  const flushCode = () => { out.push(`<pre><code>${esc(codeLines.join('\n'))}</code></pre>`); codeLines = []; };
  const isTableRow = s => /^\s*\|.*\|\s*$/.test(s);
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      flushPara(); flushList();
      if (code) { flushCode(); code = false; } else { code = true; }
      continue;
    }
    if (code) { codeLines.push(line); continue; }
    if (isTableRow(line)) {
      flushPara(); flushList();
      const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(x => x.trim());
      if (/^:?-{3,}:?$/.test(cells[0] || '')) continue;
      if (!table) { out.push('<table>'); table = true; }
      const isHeader = !out[out.length - 1]?.startsWith('<tr');
      out.push(`<tr>${cells.map(c => `<${isHeader ? 'th' : 'td'}>${inline(c)}</${isHeader ? 'th' : 'td'}>`).join('')}</tr>`);
      continue;
    }
    if (table) { out.push('</table>'); table = false; }
    if (!line.trim()) { flushPara(); flushList(); continue; }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) { flushPara(); flushList(); const n = heading[1].length; out.push(`<h${n}>${inline(heading[2])}</h${n}>`); continue; }
    if (/^\s*([-*_])\1\1+\s*$/.test(line)) { flushPara(); flushList(); out.push('<hr>'); continue; }
    const item = line.match(/^\s*([-+*]|\d+\.)\s+(.*)$/);
    if (item) {
      flushPara(); const next = /^\d/.test(item[1]) ? 'ol' : 'ul';
      if (list !== next) {
        flushList();
        const start = next === 'ol' ? ` start="${Number.parseInt(item[1], 10)}"` : '';
        out.push(`<${next}${start}>`); list = next;
      }
      out.push(`<li>${inline(item[2])}</li>`); continue;
    }
    flushList(); para.push(line.trim());
  }
  flushPara(); flushList(); if (table) out.push('</table>'); if (code) flushCode();
  return out.join('\n');
}

async function main() {
  const sections = docs.map(([file, title]) => {
    const md = fs.readFileSync(path.join(root, file), 'utf8');
    const planClass = file === 'TEST_PLAN.md' ? ' plan' : '';
    return `<section class="doc${planClass}"><div class="section-kicker">RENTOOL · TESTING DOCUMENT</div><h1>${title}</h1>${renderMarkdown(md)}</section>`;
  }).join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>RentaTool Testing Guide and Report</title><style>
@page{size:A4;margin:17mm 16mm 18mm;@bottom-right{content:"RentaTool · Testing Guide and Report · " counter(page);font:8pt Arial;color:#718291}}
@page testplan{size:A4 landscape;margin:13mm 13mm 15mm;@bottom-right{content:"RentaTool · Testing Guide and Report · " counter(page);font:8pt Arial;color:#718291}}
*{box-sizing:border-box}body{font:10pt/1.48 Arial,Helvetica,sans-serif;color:#182433;margin:0}h1,h2,h3,h4{color:#12304a;line-height:1.2;break-after:avoid}h1{font-size:25pt;margin:0 0 20px;border-bottom:2px solid #18758a;padding-bottom:9px}h2{font-size:17pt;margin:22px 0 9px}h3{font-size:12pt;margin:16px 0 6px}h4{font-size:10pt}p{margin:6px 0 10px}ul,ol{padding-left:22px;margin:5px 0 12px}li{margin:3px 0}table{width:100%;border-collapse:collapse;font-size:8.5pt;margin:9px 0 14px;break-inside:auto}tr{break-inside:avoid}th{background:#12304a;color:white;text-align:left;padding:7px}td{border-bottom:1px solid #d7e0e5;padding:6px;vertical-align:top}.doc.plan{page:testplan}.plan table{font-size:7.2pt}.plan th,.plan td{padding:4px}pre{white-space:pre-wrap;word-break:break-word;background:#f1f5f7;border-left:3px solid #18758a;padding:9px;font:8pt/1.4 Consolas,monospace;break-inside:avoid}code{font:8.5pt Consolas,monospace;background:#f1f5f7;padding:1px 3px}pre code{background:none;padding:0}a{color:#16758a;text-decoration:none}hr{border:0;border-top:1px solid #ccd7dc;margin:14px 0}.cover{height:255mm;display:flex;flex-direction:column;justify-content:center;page-break-after:always}.brand{font-size:11pt;letter-spacing:2px;color:#18758a;font-weight:bold;text-transform:uppercase}.cover h1{font-size:34pt;border:0;margin:18px 0 8px}.subtitle{font-size:15pt;color:#526b7b;max-width:145mm}.meta{margin-top:34px;background:#f0f6f8;border-left:5px solid #18758a;padding:16px 19px}.meta div{margin:5px 0}.doc{page-break-before:always}.section-kicker{font-size:8pt;letter-spacing:1.4px;color:#16758a;font-weight:bold;margin-bottom:7px}.note{color:#647789;font-size:9pt}
</style></head><body><section class="cover"><div class="brand">Software Quality Assurance · Project Report</div><h1>RentaTool<br>Testing Guide &amp; Report</h1><div class="subtitle">Detailed web, API, and Flutter test cases, recorded outcomes, and repeatable run commands.</div><div class="meta"><div><b>Project:</b> RentaTool rental platform</div><div><b>Source documents:</b> NFR report, test plan, run guide, and Flutter test report</div><div><b>Report date:</b> 7 October 2026</div><div><b>Coverage:</b> Web, API, Flutter mobile, accessibility, load, security, reliability, and recovery</div></div><p class="note" style="margin-top:24px">Results and limits follow the saved logs. No unverified case is reported as passed.</p></section>${sections}</body></html>`;
  const htmlPath = path.join(root, 'TESTING-GUIDE-AND-REPORT.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
    await page.pdf({ path: path.join(root, 'TESTING-GUIDE-AND-REPORT.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  } finally { await browser.close(); }
  console.log(`Created ${path.join(root, 'TESTING-GUIDE-AND-REPORT.pdf')}.`);
}

main().catch(err => { console.error(err); process.exitCode = 1; });
