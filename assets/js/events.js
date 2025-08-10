(async function () {
  const log = (...args) => console.debug("[events]", ...args);

  let xWidgetsReadyPromise, instagramReadyPromise;

  function ensureXWidgets() {
    if (xWidgetsReadyPromise) return xWidgetsReadyPromise;
    xWidgetsReadyPromise = new Promise((resolve) => {
      if (window.twttr?.widgets) return resolve(window.twttr);
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://platform.twitter.com/widgets.js";
      s.onload = () => {
        if (window.twttr?.ready) {
          window.twttr.ready((twttr) => resolve(twttr));
        } else {
          resolve(window.twttr);
        }
      };
      document.head.appendChild(s);
    });
    return xWidgetsReadyPromise;
  }

  function ensureInstagramEmbed() {
    if (instagramReadyPromise) return instagramReadyPromise;
    instagramReadyPromise = new Promise((resolve) => {
      if (window.instgrm?.Embeds) return resolve(window.instgrm);
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://www.instagram.com/embed.js";
      s.onload = () => resolve(window.instgrm);
      document.head.appendChild(s);
    }).then(() => {
      window.instgrm?.Embeds?.process();
      return window.instgrm;
    });
    return instagramReadyPromise;
  }

  const escapeHTML = (s = "") =>
    s.replaceAll("&", "&amp;")
     .replaceAll("<", "&lt;")
     .replaceAll(">", "&gt;")
     .replaceAll('"', "&quot;")
     .replaceAll("'", "&#39;");

  function extractTweetId(url = "") {
    const m = url.match(/status\/(\d+)/);
    return m ? m[1] : null;
  }

  function renderLinks(links = []) {
    if (!Array.isArray(links) || !links.length) return "";
    const items = links
      .map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${escapeHTML(l.label || l.url)}</a>`)
      .join("");
    return `<div class="event-links">${items}</div>`;
  }

  function createMediaEl(media = []) {
    const wrap = document.createElement("div");
    wrap.className = "event-media";

    media.forEach((m) => {
      if (m?.type === "image" && m.src) {
        const fig = document.createElement("figure");
        const img = document.createElement("img");
        img.loading = "lazy";
        img.decoding = "async";
        img.src = m.src;
        img.alt = m.alt || "";
        fig.appendChild(img);
        if (m.caption) {
          const cap = document.createElement("figcaption");
          cap.className = "event-caption";
          cap.textContent = m.caption;
          fig.appendChild(cap);
        }
        wrap.appendChild(fig);

      } else if (m?.type === "x" && m.url) {
        const mount = document.createElement("div");
        mount.className = "x-embed";
        wrap.appendChild(mount);

        const id = extractTweetId(m.url);
        if (!id) {
          mount.innerHTML = `<blockquote class="twitter-tweet"><a href="${m.url}"></a></blockquote>`;
          ensureXWidgets().then((twttr) => twttr?.widgets?.load());
        } else {
          ensureXWidgets().then((twttr) => {
            twttr?.widgets?.createTweet(id, mount, {
              align: "center",
              dnt: true,
              theme: "light",
            });
          });
        }

      } else if (m?.type === "instagram" && m.url) {
        const div = document.createElement("div");
        div.className = "instagram-embed";
        div.innerHTML = `
          <blockquote class="instagram-media"
            data-instgrm-permalink="${m.url}"
            data-instgrm-version="14"></blockquote>`;
        wrap.appendChild(div);
        ensureInstagramEmbed();
      }
    });

    return wrap;
  }

  function createCard(ev) {
    const card = document.createElement("article");
    card.className = "event-card";

    const title = document.createElement("h3");
    title.className = "event-title";
    title.textContent = ev.title || "";

    const meta = document.createElement("p");
    meta.className = "event-meta";
    meta.textContent = [ev.date, ev.location].filter(Boolean).join(" | ");

    card.appendChild(title);
    if (meta.textContent) card.appendChild(meta);

    if (ev.description) {
      const desc = document.createElement("p");
      desc.textContent = ev.description;
      card.appendChild(desc);
    }

    if (Array.isArray(ev.media) && ev.media.length) {
      card.appendChild(createMediaEl(ev.media));
    }

    if (Array.isArray(ev.links) && ev.links.length) {
      card.insertAdjacentHTML("beforeend", renderLinks(ev.links));
    }

    return card;
  }

  function getYear(d = "") {
    const m = (d || "").match(/^(\d{4})/);
    return m ? m[1] : "Other";
  }

  function groupByYear(list = []) {
    const map = new Map();
    for (const item of list) {
      const y = getYear(item.date);
      if (!map.has(y)) map.set(y, []);
      map.get(y).push(item);
    }
    const years = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    return years.map((y) => ({
      year: y,
      items: map.get(y).sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    }));
  }

function renderYearAccordion(list, mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  const acc = document.createElement("div");
  acc.className = "year-accordion";

  const grouped = groupByYear(list);
  const latestYear = grouped[0]?.year;

  grouped.forEach(({ year, items }) => {
    const d = document.createElement("details");
    if (year === latestYear) d.open = true;

    const s = document.createElement("summary");
    const chev = document.createElement("span");
    chev.className = "chev";
    const title = document.createElement("span");
    title.className = "year-title";
    title.innerHTML = `<span>${year}</span><span class="year-count">${items.length}</span>`;
    s.appendChild(chev);
    s.appendChild(title);
    d.appendChild(s);

    const listWrap = document.createElement("div");
    listWrap.className = "event-list";
    items.forEach((ev) => listWrap.appendChild(createCard(ev)));

    // アイコンだけの閉じるボタン
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "year-close-icon";
    closeBtn.setAttribute("aria-label", `${year}年を閉じる`);
    closeBtn.innerHTML = `<span class="up-chevron"></span>`;
    closeBtn.onclick = (e) => {
      e.preventDefault();
      d.open = false;
      d.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const btnWrap = document.createElement("div");
    btnWrap.className = "year-close-wrap";
    btnWrap.appendChild(closeBtn);

    listWrap.appendChild(btnWrap);
    d.appendChild(listWrap);
    acc.appendChild(d);
  });

  mount.appendChild(acc);
}


  try {
    const res = await fetch("/assets/data/events.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const hosted = data.filter((d) => d.type === "hosted");
    const appearance = data.filter((d) => d.type === "appearance");

    renderYearAccordion(hosted, "hosted-list");
    renderYearAccordion(appearance, "appearance-list");

    if (document.querySelector(".twitter-tweet") || document.querySelector(".x-embed")) {
      ensureXWidgets().then((twttr) => twttr?.widgets?.load());
    }
    if (document.querySelector(".instagram-media")) {
      ensureInstagramEmbed();
    }

    log(`rendered (accordion): hosted=${hosted.length}, appearance=${appearance.length}`);
  } catch (e) {
    console.error("[events] failed to load events.json:", e);
    const hosted = document.getElementById("hosted-list");
    const app = document.getElementById("appearance-list");
    [hosted, app].forEach((m) => {
      if (!m) return;
      const p = document.createElement("p");
      p.textContent = "イベント情報の読み込みに失敗しました。時間をおいて再度お試しください。";
      m.appendChild(p);
    });
  }
})();
