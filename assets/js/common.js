document.addEventListener('DOMContentLoaded', () => {
    // メールリンク生成
    document.querySelectorAll('.mail-link').forEach(link => {
        const u = link.dataset.user || '';
        const d = link.dataset.domain || '';
        const t = link.dataset.tld || '';
        if (!u || !d || !t) return;

        const email = `${u}@${d}.${t}`;

        link.href = `mailto:${email}`;
    });

    // フッターの年号セット
    const yearElem = document.getElementById('y');
    if (yearElem) {
        yearElem.textContent = new Date().getFullYear();
    }
});
