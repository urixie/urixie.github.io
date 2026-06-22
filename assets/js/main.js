const navLinks = document.querySelectorAll('.nav a');
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
