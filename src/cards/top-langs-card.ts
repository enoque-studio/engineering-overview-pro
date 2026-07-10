// ============================================================
// Top Languages card — pure SVG renderer
// ============================================================

import { renderBaseCard, FONT_FAMILY } from '../common/card.js';
import { escapeXml } from '../common/utils.js';
import { t } from '../common/i18n.js';

import type { LanguageData, CardOptions } from '../types/index.js';

export interface TopLangsCardOptions extends CardOptions {
  readonly hideProgress: boolean;
  readonly hideLangs: ReadonlyArray<string>; // Currently unused in renderer but good for options type
}

/**
 * Render Top Languages card SVG.
 * Pure function: (data, options) => string.
 */
export function renderTopLangsCard(
  langs: ReadonlyArray<LanguageData>,
  options: TopLangsCardOptions,
): string {
  const { theme, locale, disableAnimations } = options;

  const CARD_WIDTH = 495;
  const CARD_PADDING_TOP = 15;
  const BAR_WIDTH = 445;
  const BAR_X = 25;
  const BAR_Y = CARD_PADDING_TOP;
  const BAR_HEIGHT = 10;
  const SEGMENT_GAP = 4;

  // Random ID for clipPath to avoid conflicts between multiple cards on the same page
  const maskId = `clip-langs-${Math.random().toString(36).slice(2, 8)}`;

  const totalPercentage = langs.reduce((sum, lang) => sum + lang.percentage, 0);
  const totalGap = langs.length > 1 ? (langs.length - 1) * SEGMENT_GAP : 0;
  const availableWidth = BAR_WIDTH - totalGap;

  let currentX = BAR_X;
  const progressBars = langs
    .map((lang) => {
      // Scale width so the sum of displayed languages fills 100% of the available bar width
      const fraction = totalPercentage > 0 ? lang.percentage / totalPercentage : 0;
      const width = availableWidth * fraction;
      const radius = Math.min(BAR_HEIGHT / 2, width / 2);
      const rect = `<rect x="${String(currentX)}" y="${String(BAR_Y)}" rx="${String(radius)}" ry="${String(radius)}" width="${String(width)}" height="${String(BAR_HEIGHT)}" fill="${lang.color}" />`;
      currentX += width + SEGMENT_GAP;
      return rect;
    })
    .join('');

  const progressBarSvg = options.hideProgress
    ? ''
    : `
      <defs>
        <clipPath id="${maskId}">
          <rect x="${String(BAR_X)}" y="${String(BAR_Y - 2)}" width="${disableAnimations ? String(BAR_WIDTH) : '0'}" height="${String(BAR_HEIGHT + 4)}">
            ${
              disableAnimations
                ? ''
                : `<animate attributeName="width" from="0" to="${String(BAR_WIDTH)}" dur="1.2s" fill="freeze" calcMode="spline" keyTimes="0; 1" keySplines="0.16 1 0.3 1" />`
            }
          </rect>
        </clipPath>
      </defs>
      <!-- Segmented language bar -->
      <g clip-path="url(#${maskId})">
        ${progressBars}
      </g>
    `;

  const COLUMNS = 2;
  const COLUMN_GAP = 225; // 495 width allows for 25 left + 225 gap = 250 start for col 2
  const START_Y = options.hideProgress ? CARD_PADDING_TOP : BAR_Y + 35;
  const LINE_HEIGHT = 30;

  const itemsPerColumn = Math.ceil(langs.length / COLUMNS);

  const langList = langs
    .map((lang, index) => {
      const col = Math.floor(index / itemsPerColumn);
      const row = index % itemsPerColumn;
      const x = BAR_X + col * COLUMN_GAP;
      const y = START_Y + row * LINE_HEIGHT;
      const delay = (index + 1) * 150;
      const staggerStyle = disableAnimations ? '' : `animation-delay: ${String(delay)}ms;`;

      return `
      <g transform="translate(${String(x)}, ${String(y)})">
        <g class="stagger" style="${staggerStyle}">
          <!-- Language Color Dot with halo -->
          <circle cx="5" cy="0" r="8" fill="${lang.color}" fill-opacity="0.15" />
          <circle cx="5" cy="0" r="4" fill="${lang.color}" />

          <!-- Language Name -->
          <text x="21" y="0"
            dominant-baseline="central"
            fill="${theme.text}"
            font-size="13.5" font-weight="500"
            letter-spacing="0.2"
            font-family="${FONT_FAMILY}">
            ${escapeXml(lang.name)}
          </text>

          <!-- Language Percentage -->
          <text x="180" y="0"
            dominant-baseline="central"
            text-anchor="end"
            fill="${theme.muted}"
            font-size="12.5" font-weight="600"
            style="font-variant-numeric: tabular-nums;"
            font-family="${FONT_FAMILY}">
            ${String(lang.percentage)}%
          </text>
        </g>
      </g>`;
    })
    .join('');

  const bodyOffset = options.hideTitle ? 30 : 55;
  const paddingBottom = 26;
  const lastItemY = langs.length > 0 ? START_Y + (itemsPerColumn - 1) * LINE_HEIGHT : 0;

  const bodyHeight = langs.length > 0 ? bodyOffset + lastItemY + paddingBottom : 120;
  const cardHeight = Math.max(bodyHeight, 140);

  const body = `
    ${progressBarSvg}
    ${langList}
    ${
      langs.length === 0
        ? `<text x="25" y="30" fill="${theme.muted}" font-size="14" font-family="${FONT_FAMILY}">No languages available.</text>`
        : ''
    }
  `;

  const title = options.customTitle ?? t('top-langs.title', locale);

  return renderBaseCard({
    body,
    options: { ...options, width: CARD_WIDTH, height: cardHeight },
    title,
    description: `Top Languages`,
  });
}
