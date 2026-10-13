/**
 * Make a social post easy to read: short paragraphs with a blank line between
 * them, each numbered or bulleted point on its own line, hashtags at the end.
 * Text that is already laid out keeps its layout (only tidied).
 */
export function formatPost(input: string) {
  let t = String(input || '').replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').trim();
  if (!t) return t;

  // Hashtags: pull them off the end (or out of a final run) and put them on the last line.
  const tagRun = t.match(/(?:\s*#[\w]+)+\s*$/);
  let tags = '';
  if (tagRun) {
    tags = tagRun[0].trim().split(/\s+/).join(' ');
    t = t.slice(0, tagRun.index).trim();
  }

  const laidOut = (t.match(/\n/g) || []).length >= 2;
  if (!laidOut) {
    // The hook (first sentence) gets its own line.
    t = t.replace(/^([^.!?\n]{8,160}[.!?])\s+(?=\S)/, '$1\n');
    // One block of text: break before list items, then into short paragraphs.
    t = t
      .replace(/\s+(?=(?:\d{1,2}[.)]|[•→✅👉-])\s+\S)/g, '\n')
      .replace(/\s*(→|👉)\s*(?=[A-Z])/g, '\n\n$1 ');
    t = t
      .split('\n')
      .map((line) => {
        const item = line.trim().match(/^((?:\d{1,2}[.)]|[•→✅👉-])\s.+?[.!?])\s+(\S.*)$/);
        // A list item is one line; anything after its first sentence starts a new paragraph.
        if (item) return `${item[1]}\n\n${item[2]}`;
        if (/^\s*(?:\d{1,2}[.)]|[•→✅👉-])\s/.test(line)) return line.trim();
        const sentences = line.match(/[^.!?]+(?:[.!?]+["')\]]?|$)\s*/g) || [line];
        const paras: string[] = [];
        let cur = '';
        for (const s of sentences.map((x) => x.trim()).filter(Boolean)) {
          // One sentence per paragraph; two short ones may share a line.
          if (cur && (cur.length + s.length > 110 || /\?$/.test(cur) || /[.!?]\s/.test(cur))) {
            paras.push(cur);
            cur = s;
          } else cur = cur ? `${cur} ${s}` : s;
        }
        if (cur) paras.push(cur);
        return paras.join('\n\n');
      })
      .join('\n\n');
    // Consecutive list items sit together, with a blank line before and after the list.
    const LI = /^(?:\d{1,2}[.)]|[•✅-])\s/;
    const blocks = t.split(/\n{2,}/);
    t = blocks.reduce((acc, b, i) => (i === 0 ? b : acc + (LI.test(b) && LI.test(blocks[i - 1]) ? '\n' : '\n\n') + b), '');
  }

  t = t.replace(/\n{3,}/g, '\n\n').trim();
  return tags ? `${t}\n\n${tags}` : t;
}
