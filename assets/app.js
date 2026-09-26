/* No framework, tracking, remote dependencies or build step required. */
(() => {
  'use strict';
  const photos = window.PORTFOLIO_PHOTOS || [];
  const gallery = document.querySelector('#gallery');
  const dialog = document.querySelector('#lightbox');
  const viewerImage = document.querySelector('#lightbox-image');
  const moreButton = document.querySelector('#load-more');
  let filter = 'all';
  let visibleCount = 12;
  let currentIndex = 0;
  let returnFocus = null;
  const matchingPhotos = () => photos.filter(photo => filter === 'all' || photo.category === filter);
  const categoryLabel = value => value.charAt(0).toUpperCase() + value.slice(1);
  document.querySelector('#total-count').textContent = String(photos.length).padStart(2, '0');
  document.querySelector('#year').textContent = new Date().getFullYear();

  function createCard(photo, index) {
    const card = document.createElement('figure');
    card.className = 'photo-card';
    const button = document.createElement('button');
    button.className = 'photo-button';
    button.type = 'button';
    button.setAttribute('aria-label', `Open ${photo.title} — ${photo.alt}`);
    const img = new Image();
    img.src = photo.thumbnail;
    img.srcset = `${photo.thumbnail} 640w, ${photo.src} 1536w`;
    img.sizes = '(max-width: 650px) 45vw, 29vw';
    img.alt = photo.alt;
    img.width = photo.width;
    img.height = photo.height;
    img.loading = 'lazy';
    img.decoding = 'async';
    const expand = document.createElement('span');
    expand.className = 'photo-open';
    expand.textContent = '↗';
    expand.setAttribute('aria-hidden', 'true');
    button.append(img, expand);
    button.addEventListener('click', () => openPhoto(index, button));
    const caption = document.createElement('figcaption');
    const title = document.createElement('span');
    title.className = 'photo-title';
    title.textContent = photo.title;
    const category = document.createElement('span');
    category.className = 'photo-category';
    category.textContent = photo.category;
    caption.append(title, category);
    card.append(button, caption);
    return card;
  }

  function renderGallery(append = false) {
    const selection = matchingPhotos();
    const existingCount = append ? gallery.children.length : 0;
    if (!append) gallery.replaceChildren();
    selection.slice(existingCount, visibleCount).forEach((photo, index) => gallery.append(createCard(photo, existingCount + index)));
    const shown = Math.min(visibleCount, selection.length);
    moreButton.hidden = shown >= selection.length;
    const description = `${shown} of ${selection.length} photographs`;
    document.querySelector('#shown-count').textContent = description;
    document.querySelector('#gallery-status').textContent = `${categoryLabel(filter === 'all' ? 'all work' : filter)}: ${description}`;
    if (append) gallery.children[existingCount]?.querySelector('button').focus({preventScroll: true});
  }
  document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    visibleCount = 12;
    document.querySelectorAll('.filter').forEach(other => {
      const active = other === button;
      other.classList.toggle('active', active);
      other.setAttribute('aria-pressed', String(active));
    });
    renderGallery();
  }));
  moreButton.addEventListener('click', () => { visibleCount += 12; renderGallery(true); });

  function showPhoto() {
    const selection = matchingPhotos();
    const photo = selection[currentIndex];
    viewerImage.src = photo.src;
    viewerImage.alt = photo.alt;
    document.querySelector('#lightbox-title').textContent = photo.title;
    document.querySelector('#lightbox-category').textContent = categoryLabel(photo.category);
    document.querySelector('#lightbox-counter').textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(selection.length).padStart(2, '0')}`;
    document.querySelector('#lightbox-status').textContent = `${photo.title}. Photograph ${currentIndex + 1} of ${selection.length}.`;
    document.querySelector('#previous-photo').hidden = selection.length < 2;
    document.querySelector('#next-photo').hidden = selection.length < 2;
  }
  function openPhoto(index, trigger) {
    returnFocus = trigger;
    currentIndex = index;
    showPhoto();
    document.body.classList.add('modal-open');
    dialog.showModal();
    document.querySelector('#close-lightbox').focus();
  }
  function movePhoto(step) {
    const length = matchingPhotos().length;
    currentIndex = (currentIndex + step + length) % length;
    showPhoto();
  }
  document.querySelector('#close-lightbox').addEventListener('click', () => dialog.close());
  document.querySelector('#previous-photo').addEventListener('click', () => movePhoto(-1));
  document.querySelector('#next-photo').addEventListener('click', () => movePhoto(1));
  dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); returnFocus?.focus({preventScroll:true}); });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); movePhoto(event.key === 'ArrowLeft' ? -1 : 1); }
  });
  let touchStartX = 0;
  let touchStartY = 0;
  viewerImage.addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].clientX; touchStartY = event.changedTouches[0].clientY; }, {passive:true});
  viewerImage.addEventListener('touchend', event => {
    const dx = event.changedTouches[0].clientX - touchStartX;
    const dy = event.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) movePhoto(dx < 0 ? 1 : -1);
  }, {passive:true});

  document.querySelector('#contact-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get('name')).trim();
    const email = String(data.get('email')).trim();
    const message = String(data.get('message')).trim();
    if (!name || !message) {
      document.querySelector('#form-status').textContent = 'Please enter your name and a message.';
      return;
    }
    const subject = `Photography enquiry from ${name}`;
    const body = `Hi Roland,\n\n${message}\n\nName: ${name}\nEmail: ${email}`;
    const destination = `mailto:rolandbibajj01@icloud.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    document.querySelector('#form-status').textContent = 'Your email draft is ready to open. If your email app does not appear, email me directly using the address alongside.';
    window.location.href = destination;
  });

  renderGallery();
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), {threshold: 0.08});
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  }
})();
