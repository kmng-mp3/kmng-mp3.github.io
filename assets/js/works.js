(function () {
  async function load() {
    const res = await fetch('/assets/data/works.json', { cache: 'no-store' });
    if (!res.ok) return;
    const items = await res.json();
    const grid = document.getElementById('grid');

    // release_date の降順
    const byDate = items.slice().sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));

    for (const it of byDate) {
      const card = document.createElement('article');
      card.className = 'card';
      card.setAttribute('itemscope', '');
      card.setAttribute('itemtype', 'https://schema.org/MusicRecording');

      // タイトル
      const h3 = document.createElement('h3');
      h3.textContent = it.title || 'Untitled';
      h3.itemProp = 'name';
      card.appendChild(h3);

      // メタ情報（<br>で改行）
      const meta = document.createElement('div');
      meta.className = 'meta';

      const date = it.release_date ? new Date(it.release_date).toLocaleDateString('ja-JP') : '';
      meta.innerHTML =
        [
          [
            it.artist ? `Artist: <span itemprop="byArtist" itemscope itemtype="https://schema.org/MusicGroup"><span itemprop="name">${it.artist}</span></span>` : '',
            it.role ? `Role: ${it.role}` : ''
          ].filter(Boolean).join(' ・ '),
          [
            date ? `Release: <time itemprop="datePublished" datetime="${it.release_date}">${date}</time>` : '',
            it.label ? `Label: ${it.label}` : '',
            it.isrc ? `ISRC: ${it.isrc}` : ''
          ].filter(Boolean).join(' ・ ')
        ]
          .filter(Boolean)
          .join('<br>'); // ←ここで改行

      card.appendChild(meta);


      // 埋め込み（YouTube/Spotifyを同じラッパーに入れて高さを揃える）
      if (it.embed && it.embed.src) {
        const type = (it.embed.type || '').toLowerCase();
        const wrapper = document.createElement('div');
        wrapper.className = 'video-wrapper'; // 16:9 の高さをCSSで作る

        const iframe = document.createElement('iframe');
        iframe.src = it.embed.src;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allowFullscreen = true;
        iframe.setAttribute('loading', 'lazy');

        if (type === 'youtube') {
          iframe.title = 'YouTube video player';
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        }

        if (type === 'spotify') {
          iframe.className = 'spotify-embed';
          iframe.allow = 'encrypted-media';
        }

        wrapper.appendChild(iframe);
        card.appendChild(wrapper);
      }

      // JSON-LD
      const ld = {
        '@context': 'https://schema.org',
        '@type': 'MusicRecording',
        name: it.title,
        byArtist: it.artist ? { '@type': 'MusicGroup', name: it.artist } : undefined,
        datePublished: it.release_date,
        image: it.cover,
        recordLabel: it.label ? { '@type': 'Organization', name: it.label } : undefined,
        isrcCode: it.isrc || undefined,
        url: (it.links && it.links[0] && it.links[0].url) || undefined
      };
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(ld, null, 2);
      card.appendChild(script);

      grid.appendChild(card);
    }
  }

  load().catch(console.error);
})();
