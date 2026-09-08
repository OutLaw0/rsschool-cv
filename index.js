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
// Choose light, distortion, matrix, or flip in the HTML to compare the effects.
const profileEffect = profile.dataset.effect === 'distortion' ? createDistortionEffect()
  : profile.dataset.effect === 'matrix' ? createMatrixEffect() : null;
let flipped = false;
function setProfileFlipped(value) {
  flipped = value;
  profile.classList.toggle('is-flipped', value);
  profileEffect?.setTarget(value ? 1 : 0);
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

function createMatrixEffect() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  const defs = document.createElementNS(svgNS, 'defs');
  svg.append(defs);
  profile.append(svg);
  const size = 24;
  const glyphs = '01<>/{}[]アイウエオカキクケコ';
  const cells = Array.from({ length: size * size }, (_, i) => {
    const x = i % size;
    const y = Math.floor(i / size);
    const noise = ((i * 73 + 19) % 151) / 151;
    return { x, y, delay: (y / (size - 1)) * .32 + noise * .38 };
  });
  const layers = [...profileButtons].map((button, index) => {
    const clip = document.createElementNS(svgNS, 'clipPath');
    clip.id = `profile-matrix-${index}`;
    clip.setAttribute('clipPathUnits', 'objectBoundingBox');
    const rects = cells.map(() => {
      const rect = document.createElementNS(svgNS, 'rect');
      clip.append(rect);
      return rect;
    });
    defs.append(clip);
    const front = button.querySelector('.profile-card__front');
    front.style.clipPath = `url(#${clip.id})`;
    const canvas = document.createElement('canvas');
    canvas.className = 'profile-matrix-code';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.width = canvas.height = 560;
    button.querySelector('.profile-card__inner').append(canvas);
    return { rects, front, canvas, ctx: canvas.getContext('2d') };
  });
  profile.classList.add('matrix-ready');
  let progress = 0;
  let target = 0;
  let frame = 0;
  let lastTime = 0;
  const clamp = (n) => Math.max(0, Math.min(1, n));

  function render() {
    layers.forEach(({ rects, front, ctx, canvas }) => {
      front.style.visibility = progress === 1 ? 'hidden' : 'visible';
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      cells.forEach(({ x, y, delay }, i) => {
        const phase = clamp((progress - delay) / .3);
        const remaining = 1 - phase * phase * (3 - 2 * phase);
        // Slight overlap prevents hairline seams on the untouched front face.
        const extent = remaining === 1 ? 1.004 : remaining;
        rects[i].setAttribute('x', (x + (1 - extent) / 2) / size);
        rects[i].setAttribute('y', (y + (1 - extent) / 2) / size);
        rects[i].setAttribute('width', extent / size);
        rects[i].setAttribute('height', extent / size);
        if (!ctx || reducedMotion.matches || phase <= 0 || phase >= 1) return;
        const pulse = Math.sin(phase * Math.PI);
        const unit = canvas.width / size;
        ctx.fillStyle = `rgba(15, 38, 51, ${pulse * .8})`;
        ctx.fillRect(x * unit, y * unit, unit, unit);
        ctx.strokeStyle = `rgba(132, 213, 255, ${pulse * .45})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(x * unit + 1, y * unit + 1, unit - 2, unit - 2);
        ctx.font = `${unit * .52}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(190, 239, 255, ${pulse})`;
        const glyph = glyphs[(i + Math.floor(phase * 5)) % glyphs.length];
        ctx.fillText(glyph, (x + .5) * unit, (y + .5) * unit);
      });
    });
  }

  function tick(time) {
    const delta = Math.min(time - lastTime, 50) / 1200;
    lastTime = time;
    progress = target > progress ? Math.min(target, progress + delta) : Math.max(target, progress - delta);
    render();
    frame = progress === target ? 0 : requestAnimationFrame(tick);
  }

  function setTarget(value) {
    target = value;
    if (reducedMotion.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      progress = target;
      render();
    } else if (!frame && progress !== target) {
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  reducedMotion.addEventListener('change', () => setTarget(target));
  render();
  return { setTarget };
}

function createDistortionEffect() {
  // Displacement + crossfade, inspired by robin-dela/hover-effect.
  // SVG filters let the live text and the portrait share the same vertical flow.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  const defs = document.createElementNS(ns, 'defs');
  svg.append(defs);
  const displacements = [1, -1].map((direction, index) => {
    const filter = document.createElementNS(ns, 'filter');
    filter.id = `profile-flow-${index}`;
    filter.setAttribute('x', '-30%');
    filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '160%');
    filter.setAttribute('height', '200%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    const noise = document.createElementNS(ns, 'feTurbulence');
    noise.setAttribute('type', 'fractalNoise');
    noise.setAttribute('baseFrequency', '.045 .09');
    noise.setAttribute('numOctaves', '3');
    noise.setAttribute('seed', '8');
    noise.setAttribute('result', 'noise');
    const vertical = document.createElementNS(ns, 'feColorMatrix');
    vertical.setAttribute('in', 'noise');
    vertical.setAttribute('type', 'matrix');
    // Red stays at 0.5, so the displacement has no horizontal component.
    vertical.setAttribute('values', '0 0 0 0 .5  0 1 0 0 0  0 0 0 0 0  0 0 0 0 1');
    vertical.setAttribute('result', 'vertical-map');
    const displacement = document.createElementNS(ns, 'feDisplacementMap');
    displacement.setAttribute('in', 'SourceGraphic');
    displacement.setAttribute('in2', 'vertical-map');
    displacement.setAttribute('xChannelSelector', 'R');
    displacement.setAttribute('yChannelSelector', 'G');
    displacement.setAttribute('scale', '0');
    filter.append(noise, vertical, displacement);
    defs.append(filter);
    return { displacement, direction };
  });
  profile.append(svg);
  const faces = [...profileButtons].map(button => ({
    front: button.querySelector('.profile-card__front'),
    back: button.querySelector('.profile-card__back')
  }));
  profile.classList.add('distortion-ready');
  let progress = 0;
  let target = 0;
  let frame = 0;
  let lastTime = 0;

  function render() {
    const blend = progress * progress * (3 - 2 * progress);
    const moving = progress > 0 && progress < 1;
    displacements[0].displacement.setAttribute('scale', 130 * blend);
    displacements[1].displacement.setAttribute('scale', -130 * (1 - blend));
    faces.forEach(({ front, back }) => {
      front.style.opacity = String(1 - blend);
      front.style.visibility = progress === 1 ? 'hidden' : 'visible';
      back.style.visibility = progress === 0 ? 'hidden' : 'visible';
      front.style.filter = moving ? 'url(#profile-flow-0)' : 'none';
      back.style.filter = moving ? 'url(#profile-flow-1)' : 'none';
      front.style.transform = moving ? `translateY(${-18 * blend}px) scale(${1 + .12 * blend})` : 'none';
      back.style.transform = moving ? `translateY(${18 * (1 - blend)}px) scale(${1 + .12 * (1 - blend)})` : 'none';
    });
  }
  function tick(time) {
    const step = Math.min(time - lastTime, 50) / 200;
    lastTime = time;
    progress = target > progress ? Math.min(target, progress + step) : Math.max(target, progress - step);
    render();
    frame = progress === target ? 0 : requestAnimationFrame(tick);
  }
  function setTarget(value) {
    target = value;
    if (reducedMotion.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      progress = target;
      render();
    } else if (!frame && progress !== target) {
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  reducedMotion.addEventListener('change', () => setTarget(target));
  render();
  return { setTarget };
}
