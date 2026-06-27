const SHOCK_RADIUS = { desktop: 0.35, mobile: 0.4 };
const PLANET_RADIUS = { desktop: 0.3, mobile: 0.4 };

export function isMobileViewport() {
  return window.innerWidth < 768;
}

export function shockwaveDiameterPx(
  width: number,
  height: number,
  isMobile: boolean,
  diameterMul = 1,
) {
  const radius = isMobile ? SHOCK_RADIUS.mobile : SHOCK_RADIUS.desktop;
  return radius * 2 * Math.min(width, height) * 0.25 * diameterMul;
}

export function planetRadiusPx(
  width: number,
  height: number,
  isMobile: boolean,
) {
  const radius = isMobile ? PLANET_RADIUS.mobile : PLANET_RADIUS.desktop;
  return radius * Math.min(width, height);
}

export function isWithinPlanet(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  isMobile: boolean,
) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const r = planetRadiusPx(rect.width, rect.height, isMobile);
  return dx * dx + dy * dy <= r * r;
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
