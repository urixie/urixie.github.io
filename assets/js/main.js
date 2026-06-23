const navLinks = document.querySelectorAll('.nav a');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const yearTargets = document.querySelectorAll('[data-current-year]');

yearTargets.forEach(target => {
  target.textContent = new Date().getFullYear();
});

function getWorkExperience(startYear, startMonth) {
  const now = new Date();
  let months = (now.getFullYear() - startYear) * 12 + (now.getMonth() - startMonth);
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths ? `${years} 年 ${remainingMonths} 个月` : `${years} 年`;
}

document.querySelectorAll('#work-experience, #work-experience-about').forEach(target => {
  target.textContent = getWorkExperience(2022, 1);
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