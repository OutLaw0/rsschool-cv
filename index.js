const burgerButton = document.querySelector('.hamburger');
const nav = document.querySelector('.nav');
const mobileNav = window.matchMedia('(max-width: 796px)');

function setNavigation(open) {
  burgerButton.classList.toggle('is-active', open);
  burgerButton.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-active', open);
}
burgerButton.addEventListener('click', () => {
  setNavigation(burgerButton.getAttribute('aria-expanded') !== 'true');
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.nav-container') || event.target.closest('.nav-link')) {
    setNavigation(false);
  }
});
mobileNav.addEventListener('change', () => setNavigation(false));

const scrollToTopBtn = document.querySelector('.button-to-top');
function updateScrollButton() {
  scrollToTopBtn.style.opacity = window.scrollY > 0 ? '1' : '0';
}
document.addEventListener('scroll', updateScrollButton, { passive: true });
updateScrollButton();
scrollToTopBtn.addEventListener('click', (event) => {
  event.preventDefault();
  window.scrollTo(0, 0);
});

const showMoreButton = document.querySelector('.js-show-more');
const projectList = document.querySelector('.js-excerpt');
function updateProjectFocus() {
  // Clipped project links must not remain in the keyboard tab order.
  const expanded = showMoreButton.getAttribute('aria-expanded') === 'true';
  const boundary = projectList.getBoundingClientRect().bottom - 60;
  projectList.querySelectorAll('.projects-item').forEach((item) => {
    item.inert = !expanded && item.getBoundingClientRect().bottom > boundary;
  });
}
showMoreButton.addEventListener('click', () => {
  const expanded = showMoreButton.getAttribute('aria-expanded') !== 'true';
  showMoreButton.setAttribute('aria-expanded', String(expanded));
  showMoreButton.textContent = expanded ? 'Show less' : 'Show more';
  projectList.classList.toggle('excerpt-hidden', !expanded);
  projectList.classList.toggle('excerpt-visible', expanded);
  updateProjectFocus();
});
new ResizeObserver(updateProjectFocus).observe(projectList);
window.addEventListener('load', updateProjectFocus);

const profile = document.querySelector('.profile-cards');
const profileButtons = profile.querySelectorAll('.profile-card');
const hoverAvailable = window.matchMedia('(hover: hover) and (pointer: fine)');
let flipped = false;
function setProfileFlipped(value) {
  flipped = value;
  profile.classList.toggle('is-flipped', value);
  profileButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(value));
    button.setAttribute('aria-label', value ? 'Show original profile' : 'Show AI-powered profile');
    button.querySelector('.profile-card__front').setAttribute('aria-hidden', String(value));
    button.querySelector('.profile-card__back').setAttribute('aria-hidden', String(!value));
  });
}
profileButtons.forEach((button) => {
  button.addEventListener('pointerenter', (event) => {
    if (hoverAvailable.matches && event.pointerType === 'mouse') setProfileFlipped(true);
  });
  // Native buttons provide Enter and Space activation as well as touch clicks.
  button.addEventListener('click', (event) => {
    if (event.detail === 0 || event.pointerType === 'touch' || !hoverAvailable.matches) {
      setProfileFlipped(!flipped);
    }
  });
});
profile.addEventListener('pointerleave', (event) => {
  if (hoverAvailable.matches && event.pointerType === 'mouse') setProfileFlipped(false);
});
profile.addEventListener('focusout', (event) => {
  if (!profile.contains(event.relatedTarget)) setProfileFlipped(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setProfileFlipped(false);
    if (burgerButton.getAttribute('aria-expanded') === 'true') {
      setNavigation(false);
      burgerButton.focus();
    }
  }
});
const aiPortrait = document.querySelector('.profile-ai');
function useOriginalPortrait() {
  aiPortrait.src = 'assets/img/IMG_20211213_015949_230.jpg';
  aiPortrait.alt = 'Valentin Akimov';
}
aiPortrait.addEventListener('error', useOriginalPortrait, { once: true });
if (aiPortrait.complete && aiPortrait.naturalWidth === 0) useOriginalPortrait();
