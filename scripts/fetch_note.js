// 用途: NOTEのRSSから最新記事 {title, link, pubDate} を抽出し、/assets/data/note_latest.json に保存
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Parser from 'rss-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RSS_URL = process.env.NOTE_RSS_URL || 'https://note.com/sakeme/m/m46cdca3b0d75/rss';
const OUT_DIR = path.resolve(__dirname, '..', 'assets', 'data');
const OUT_FILE = path.join(OUT_DIR, 'note_latest.json');

function toIso(d) {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.toISOString();
}

(async () => {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL(RSS_URL);
    if (!feed?.items?.length) throw new Error('No items in feed');

    // pubDate降順でソートして最新を取得
    const latest = [...feed.items].sort((a, b) =>
      new Date(b.pubDate) - new Date(a.pubDate)
    )[0];

    const payload = {
      title: latest.title?.trim() || '',
      link: latest.link?.trim() || '',
      pubDate: toIso(latest.pubDate || '')
    };

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    console.log('Wrote:', OUT_FILE, payload);
  } catch (err) {
    console.error('Failed to fetch/parse RSS:', err);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify({ title:'', link:'', pubDate:'' }, null, 2), 'utf-8');
    process.exitCode = 1;
  }
})();