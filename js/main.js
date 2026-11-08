// Nav: add shadow after scroll
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Gallery lightbox
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
document.querySelectorAll('#gallery figure').forEach(fig => {
  fig.addEventListener('click', () => {
    lbImg.src = fig.dataset.full;
    lb.classList.add('open');
  });
});
const closeLb = () => { lb.classList.remove('open'); lbImg.src = ''; };
document.getElementById('lbClose').addEventListener('click', closeLb);
lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
