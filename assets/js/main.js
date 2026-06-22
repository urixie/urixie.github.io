const navLinks = document.querySelectorAll('.nav a');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const yearTargets = document.querySelectorAll('[data-current-year]');

yearTargets.forEach(target => {
  target.textContent = new Date().getFullYear();
});

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open', !expanded);
  });
}

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (menuToggle && nav) {
      menuToggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    }
  });
});
const sections = Array.from(navLinks)
  .map(link => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

function updateActiveNav() {
  const current = sections
    .slice()
    .reverse()
    .find(section => window.scrollY >= section.offsetTop - 160);

  if (!current) return;

  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`);
  });
}

window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();
