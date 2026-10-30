const grid = document.querySelector('#grid');
const chips = document.querySelector('#chips');
const stats = document.querySelector('#stats');
const empty = document.querySelector('#empty');
const search = document.querySelector('#search');

let cards = [];
let activeTag = '全部';
let tagCount = 0;

const facets = (card) => [card.character, card.style, card.theme, card.rarity].filter(Boolean);
const haystack = (card) => [card.title, card.title_en, card.edition, ...facets(card)]
  .join(' ').toLowerCase();

function render() {
  const query = search.value.trim().toLowerCase();
  const shown = cards.filter((card) => {
    const hitTag = activeTag === '全部' || facets(card).includes(activeTag);
    return hitTag && (!query || haystack(card).includes(query));
  });

  grid.replaceChildren(...shown.map((card) => {
    const link = document.createElement('a');
    link.className = 'card';
    link.href = card.href;

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const image = document.createElement('img');
    image.src = card.cover;
    image.alt = card.title + ' 卡面';
    image.loading = 'lazy';
    thumb.append(image);

    const row = document.createElement('div');
    row.className = 'row';
    const no = document.createElement('span');
    no.className = 'no';
    no.textContent = card.edition;
    const rarity = document.createElement('span');
    rarity.className = 'rarity';
    rarity.textContent = card.rarity || '藏品';
    row.append(no, rarity);

    const title = document.createElement('h3');
    title.textContent = card.title;

    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = [card.character, card.theme].filter(Boolean).join(' · ');

    link.append(thumb, row, title, meta);
    return link;
  }));

  empty.hidden = shown.length > 0;
  stats.textContent = `${shown.length} 张藏品 · ${tagCount} 个分类`
    + (shown.length !== cards.length ? ` / 共 ${cards.length} 张` : '');
}

function buildChips() {
  const tags = ['全部'];
  for (const card of cards) {
    for (const facet of facets(card)) if (!tags.includes(facet)) tags.push(facet);
  }
  tagCount = tags.length - 1;

  chips.replaceChildren(...tags.map((tag) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = tag;
    button.setAttribute('aria-pressed', String(tag === activeTag));
    button.addEventListener('click', () => {
      activeTag = tag;
      for (const chip of chips.children) chip.setAttribute('aria-pressed', String(chip === button));
      render();
    });
    return button;
  }));
}

async function boot() {
  const [config, manifest] = await Promise.all([
    fetch('./site.json').then((response) => response.json()),
    fetch('./cards.json').then((response) => response.json()),
  ]);

  document.querySelector('#brand-cn').textContent = config.name_cn;
  document.querySelector('#tagline').textContent = config.tagline;
  document.querySelector('#kind').textContent = config.kind;
  document.querySelector('#gallery-title').textContent = config.gallery_title;
  document.querySelector('#gallery-note').textContent = config.gallery_note;
  document.querySelector('#footer').textContent = config.footer;
  document.querySelector('.wordmark').textContent = config.name;
  document.title = `${config.name_cn} · ${config.name}`;

  cards = manifest;
  buildChips();
  render();
  search.addEventListener('input', render);
}

boot().catch((error) => {
  stats.textContent = '卡片清单载入失败';
  console.error(error);
});
