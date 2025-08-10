(async () => {
  const url = '/assets/data/note_latest.json'; // Actionsが生成
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json(); // { title, link, pubDate }
    const a = document.getElementById('note-latest-link');
    const d = document.getElementById('note-latest-date');
    if (a && data?.link) {
      a.href = data.link;
      a.textContent = data.title || '最新記事';
    }
    if (d && data?.pubDate) {
      const dt = new Date(data.pubDate);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      d.textContent = `（${y}-${m}-${day}）`;
      d.style.marginLeft = '0.5rem';
      d.style.fontSize = '0.9em';
      d.style.opacity = '0.8';
    }
  } catch (e) {
    const a = document.getElementById('note-latest-link');
    if (a) a.textContent = '最新記事を読み込めませんでした';
  }
})();