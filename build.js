const fs = require('fs');
const path = require('path');
const katex = require('katex');

const SRC = __dirname;
const DIST = path.join(__dirname, 'dist');

const MACROS = {
  '\\dd': '\\mathrm{d}',
  '\\vv': '\\boldsymbol',
  '\\ii': '\\hat{\\imath}',
  '\\jj': '\\hat{\\jmath}',
  '\\kk': '\\hat{k}'
};

// Render a LaTeX string to HTML
function renderMath(tex, displayMode) {
  try {
    return katex.renderToString(tex, {
      displayMode,
      macros: MACROS,
      throwOnError: false,
      strict: false
    });
  } catch (e) {
    console.warn('KaTeX render warning:', tex.slice(0, 60), e.message);
    return katex.renderToString(tex, {
      displayMode,
      macros: MACROS,
      throwOnError: false,
      strict: false
    });
  }
}

// Replace all $$...$$ and $...$ with pre-rendered HTML
function renderMathInHTML(html) {
  // Step 1: display math $$...$$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    return renderMath(tex.trim(), true);
  });

  // Step 2: inline math $...$  (but not inside HTML tags or already-rendered katex spans)
  // Use a careful regex that avoids matching inside HTML attributes
  html = html.replace(/\$([^\$<>]+?)\$/g, (match, tex, offset) => {
    // Skip if inside an HTML tag (rough check: find last < before offset without closing >)
    const before = html.slice(Math.max(0, offset - 200), offset);
    const lastOpen = before.lastIndexOf('<');
    const lastClose = before.lastIndexOf('>');
    if (lastOpen > lastClose) return match; // inside a tag

    // Skip if it looks like a CSS value (e.g., font-size)
    if (/^\d/.test(tex) && /\d$/.test(tex)) return match;

    return renderMath(tex.trim(), false);
  });

  return html;
}

// Remove KaTeX JS script tags (keep CSS link)
function removeKatexScripts(html) {
  // Remove the katex.min.js script
  html = html.replace(/<script\s+defer\s+src="[^"]*katex\.min\.js"[^>]*><\/script>\s*/g, '');
  // Remove the auto-render script
  html = html.replace(/<script\s+defer\s+src="[^"]*auto-render\.min\.js"[\s\S]*?<\/script>\s*/g, '');
  return html;
}

// Copy non-HTML files, process HTML files
function build() {
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true });
  }
  fs.mkdirSync(DIST, { recursive: true });

  const files = fs.readdirSync(SRC);
  let htmlCount = 0;

  for (const file of files) {
    // Skip build artifacts and node_modules
    if (file === 'dist' || file === 'node_modules' || file === '.git' ||
        file === 'build.js' || file === 'package.json' || file === 'package-lock.json') {
      continue;
    }

    const srcPath = path.join(SRC, file);
    const destPath = path.join(DIST, file);

    if (fs.statSync(srcPath).isDirectory()) {
      // Recursively copy directories (e.g. img/)
      fs.mkdirSync(destPath, { recursive: true });
      const subFiles = fs.readdirSync(srcPath);
      for (const sf of subFiles) {
        const sp = path.join(srcPath, sf);
        if (!fs.statSync(sp).isDirectory()) {
          fs.copyFileSync(sp, path.join(destPath, sf));
        }
      }
      console.log(`Copied directory: ${file}/ (${subFiles.length} files)`);
      continue;
    }

    if (file.endsWith('.html')) {
      console.log(`Processing: ${file}`);
      let html = fs.readFileSync(srcPath, 'utf-8');
      html = renderMathInHTML(html);
      html = removeKatexScripts(html);
      fs.writeFileSync(destPath, html, 'utf-8');
      htmlCount++;
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  console.log(`\nBuild complete: ${htmlCount} HTML files pre-rendered to dist/`);
}

build();
