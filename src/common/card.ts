// ============================================================
// Base SVG card template and error card renderer
// ============================================================

import { escapeXml } from './utils.js';

import type { CardOptions, ThemeConfig } from '../types/index.js';

const FONT_FAMILY = "'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif";

/** Signature easing curve shared by every card animation. */
const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';

interface BaseCardParams {
  readonly body: string;
  readonly options: CardOptions;
  readonly title?: string | undefined;
  readonly description?: string | undefined;
}

/**
 * Generate the CSS animation keyframes for card content.
 */
function renderAnimationStyles(disabled: boolean): string {
  if (disabled) {
    return `
      .stagger { opacity: 1; }
    `;
  }

  return `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .stagger { opacity: 1; }
    }

    @media (prefers-reduced-motion: no-preference) {
      .stagger {
        opacity: 0;
        animation: fadeInUp 600ms ${EASE_OUT_EXPO} forwards;
      }
    }
  `;
}

/**
 * Render base SVG card wrapper with border, background, title, and animations.
 * All card renderers compose inside this.
 */
export function renderBaseCard({ body, options, title, description }: BaseCardParams): string {
  const {
    theme,
    hideBorder,
    borderRadius,
    hideTitle,
    customTitle,
    disableAnimations,
    width,
    height,
  } = options;
  const displayTitle = customTitle ?? title ?? '';
  const displayDesc = description ?? displayTitle;

  const borderAttrs = hideBorder
    ? `stroke="none" stroke-width="0"`
    : `stroke="url(#border-grad)" stroke-width="1"`;

  const titleSection = hideTitle
    ? ''
    : `
    <g transform="translate(24, 33)">
      <g class="stagger" style="animation-delay: 0ms;">
        <rect x="0" y="-7" width="3" height="14" rx="1.5" fill="url(#accent-grad)" />
        <text x="13" y="0"
          class="title"
          dominant-baseline="central"
          fill="${theme.title}"
          font-size="14"
          font-weight="600"
          letter-spacing="0.3"
          font-family="${FONT_FAMILY}">
          ${escapeXml(displayTitle)}
        </text>
      </g>
    </g>
    <line x1="24" y1="50" x2="${String(width - 24)}" y2="50"
      stroke="url(#divider-grad)" stroke-width="1" />`;

  const bodyOffset = hideTitle ? 30 : 55;

  return `<svg xmlns="http://www.w3.org/2000/svg"
  width="${String(width)}" height="${String(height)}"
  viewBox="0 0 ${String(width)} ${String(height)}"
  role="img"
  aria-labelledby="card-title card-desc">
  <title id="card-title">${escapeXml(displayTitle)}</title>
  <desc id="card-desc">${escapeXml(displayDesc)}</desc>
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="24" flood-color="#000000" flood-opacity="0.15" />
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.05" />
    </filter>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.surface}" />
    </linearGradient>
    <linearGradient id="border-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.border}" stop-opacity="0.7" />
      <stop offset="100%" stop-color="${theme.border}" stop-opacity="0.15" />
    </linearGradient>
    <linearGradient id="accent-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.icon}" />
      <stop offset="100%" stop-color="${theme.purple}" />
    </linearGradient>
    <linearGradient id="divider-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.border}" stop-opacity="0.55" />
      <stop offset="100%" stop-color="${theme.border}" stop-opacity="0" />
    </linearGradient>
    <radialGradient id="corner-glow" cx="0%" cy="0%" r="90%">
      <stop offset="0%" stop-color="${theme.icon}" stop-opacity="0.08" />
      <stop offset="55%" stop-color="${theme.icon}" stop-opacity="0.02" />
      <stop offset="100%" stop-color="${theme.icon}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <style>
    ${renderAnimationStyles(disableAnimations)}
    .title { font-family: ${FONT_FAMILY}; }
    .stat-label { font-family: ${FONT_FAMILY}; font-size: 13.5px; font-weight: 500; letter-spacing: 0.2px; }
    .stat-value { font-family: ${FONT_FAMILY}; font-size: 14.5px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .small { font-family: ${FONT_FAMILY}; font-size: 12px; font-weight: 400; }
    .micro-label { font-family: ${FONT_FAMILY}; font-size: 10px; font-weight: 600; letter-spacing: 1.5px; }
  </style>
  <rect x="0.5" y="0.5"
    rx="${String(borderRadius)}" ry="${String(borderRadius)}"
    width="${String(width - 1)}" height="${String(height - 1)}"
    fill="url(#bg-grad)"
    filter="url(#shadow)"
    ${borderAttrs} />
  <rect x="0.5" y="0.5"
    rx="${String(borderRadius)}" ry="${String(borderRadius)}"
    width="${String(width - 1)}" height="${String(height - 1)}"
    fill="url(#corner-glow)" />
  <rect x="1" y="1"
    rx="${String(borderRadius)}" ry="${String(borderRadius)}"
    width="${String(width - 2)}" height="1"
    fill="#ffffff" opacity="0.06" />
  ${titleSection}
  <g transform="translate(0, ${String(bodyOffset)})">
    ${body}
  </g>
</svg>`;
}

/**
 * Render a styled error card — always returned as SVG, never JSON/text.
 * HTTP 200 with error content so GitHub README renders it.
 */
export function renderErrorCard(
  message: string,
  theme: ThemeConfig,
  width: number = 495,
  height: number = 120,
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg"
  width="${String(width)}" height="${String(height)}"
  viewBox="0 0 ${String(width)} ${String(height)}"
  role="img"
  aria-labelledby="error-title error-desc">
  <title id="error-title">Error</title>
  <desc id="error-desc">${escapeXml(message)}</desc>
  <defs>
    <filter id="error-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="24" flood-color="#000000" flood-opacity="0.15" />
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.05" />
    </filter>
    <linearGradient id="error-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.surface}" />
    </linearGradient>
    <linearGradient id="error-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.red}" stop-opacity="0.55" />
      <stop offset="100%" stop-color="${theme.red}" stop-opacity="0.1" />
    </linearGradient>
    <radialGradient id="error-glow" cx="0%" cy="0%" r="90%">
      <stop offset="0%" stop-color="${theme.red}" stop-opacity="0.07" />
      <stop offset="100%" stop-color="${theme.red}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect x="0.5" y="0.5"
    rx="12" ry="12"
    width="${String(width - 1)}" height="${String(height - 1)}"
    fill="url(#error-bg)"
    filter="url(#error-shadow)"
    stroke="url(#error-border)" stroke-width="1" />
  <rect x="0.5" y="0.5"
    rx="12" ry="12"
    width="${String(width - 1)}" height="${String(height - 1)}"
    fill="url(#error-glow)" />
  <rect x="1" y="1"
    rx="12" ry="12"
    width="${String(width - 2)}" height="1"
    fill="#ffffff" opacity="0.06" />
  <g transform="translate(26, ${String(Math.round(height / 2) - 4)})">
    <rect x="0" y="-14" width="28" height="28" rx="8"
      fill="${theme.red}" fill-opacity="0.1"
      stroke="${theme.red}" stroke-opacity="0.25" stroke-width="1" />
    <g transform="translate(6, -8)">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${theme.red}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    </g>
    <text x="42" y="-6"
      dominant-baseline="central"
      fill="${theme.title}"
      font-size="15" font-weight="600"
      letter-spacing="0.3"
      font-family="${FONT_FAMILY}">
      Something went wrong
    </text>
    <text x="42" y="16"
      dominant-baseline="central"
      fill="${theme.text}"
      font-size="13" font-weight="400"
      font-family="${FONT_FAMILY}">
      ${escapeXml(message)}
    </text>
  </g>
</svg>`;
}

export { FONT_FAMILY, EASE_OUT_EXPO };
