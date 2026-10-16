// Small, dependency-free JSONC reader/editor for the standalone package installer.
// Edits touch only the selected property; unrelated formatting and comments survive.
export function readJsonc(text) {
  const tokens = [];
  let clean = '';
  for (let i = 0; i < text.length;) {
    const start = i;
    if (i === 0 && text[i] === '\uFEFF') { clean += ' '; i++; continue; }
    if (/\s/.test(text[i])) { clean += text[i++]; continue; }
    if (text.startsWith('//', i)) {
      while (i < text.length && !/[\r\n]/.test(text[i])) i++;
      clean += ' '.repeat(i - start);
      continue;
    }
    if (text.startsWith('/*', i)) {
      const end = text.indexOf('*/', i + 2);
      if (end < 0) throw Error('Unterminated JSONC comment');
      i = end + 2;
      clean += text.slice(start, i).replace(/[^\r\n]/g, ' ');
      continue;
    }
    if (text[i] === '"') {
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\') i++;
        i++;
      }
      if (i === text.length) throw Error('Unterminated JSONC string');
      i++;
    } else if ('{}[]:,'.includes(text[i])) i++;
    else {
      while (i < text.length && !/[\s{}\[\]:,\/]/.test(text[i])) i++;
      if (i === start) throw Error('Invalid JSONC token');
    }
    const raw = text.slice(start, i);
    tokens.push({ raw, start, end: i });
    clean += raw;
  }
  // Remove trailing commas only outside strings and comments, keeping offsets.
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];
    if (token.raw === ',' && [']', '}'].includes(tokens[i + 1].raw)) {
      clean = clean.slice(0, token.start) + ' ' + clean.slice(token.end);
    }
  }
  const value = JSON.parse(clean);
  let cursor = 0;
  function node() {
    const token = tokens[cursor++];
    const result = { start: token.start, end: token.end, properties: [] };
    if (token.raw === '{') {
      const names = new Set();
      while (tokens[cursor].raw !== '}') {
        const key = tokens[cursor++];
        const name = JSON.parse(key.raw);
        if (names.has(name)) throw Error(`Duplicate JSONC property: ${name}`);
        names.add(name);
        cursor++; // Colon; syntax was validated by JSON.parse above.
        const child = node();
        const comma = tokens[cursor].raw === ',' ? tokens[cursor++] : null;
        result.properties.push({ name, start: key.start, child, comma });
      }
      result.close = tokens[cursor].start;
      result.end = tokens[cursor++].end;
      result.object = true;
    } else if (token.raw === '[') {
      while (tokens[cursor].raw !== ']') {
        node();
        if (tokens[cursor].raw === ',') cursor++;
      }
      result.end = tokens[cursor++].end;
    }
    return result;
  }
  return { value, tree: node() };
}

export function editJsonc(text, keys, value, remove = false) {
  const { tree } = readJsonc(text);
  let current = tree;
  for (let i = 0; i < keys.length; i++) {
    if (!current.object) throw Error('Expected a JSONC object');
    const property = current.properties.find(entry => entry.name === keys[i]);
    if (i < keys.length - 1 && property) { current = property.child; continue; }
    if (remove) {
      if (!property) return text;
      const edits = [{ start: property.start, end: property.child.end, text: '' }];
      const previous = current.properties[current.properties.indexOf(property) - 1];
      const comma = property.comma ?? previous?.comma;
      if (comma) edits.push({ start: comma.start, end: comma.end, text: '' });
      return apply(text, edits);
    }
    let inserted = value;
    for (let j = keys.length - 1; j > i; j--) inserted = { [keys[j]]: inserted };
    const newline = text.includes('\r\n') ? '\r\n' : '\n';
    const indentation = '  '.repeat(i + 1);
    const serialized = JSON.stringify(inserted, null, 2).replace(/\n/g, newline + indentation);
    if (property) {
      return apply(text, [{ start: property.child.start, end: property.child.end, text: serialized }]);
    }
    const last = current.properties.at(-1);
    const edits = [];
    if (last && !last.comma) edits.push({ start: last.child.end, end: last.child.end, text: ',' });
    edits.push({ start: current.close, end: current.close,
      text: `${newline}${indentation}${JSON.stringify(keys[i])}: ${serialized}${newline}${'  '.repeat(i)}` });
    return apply(text, edits);
  }
  throw Error('A property path is required');
}

function apply(text, edits) {
  for (const edit of edits.reverse().sort((a, b) => b.start - a.start)) {
    text = text.slice(0, edit.start) + edit.text + text.slice(edit.end);
  }
  return text;
}
