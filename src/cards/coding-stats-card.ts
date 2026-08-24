// ============================================================
// Coding Stats Card — pure SVG renderer
// ============================================================
// Layout: Metric chips → Segmented language bar + legend →
// Project rows with proportional duration bars.
// Minimal top-to-bottom hierarchy, theme-aware colors.
// ============================================================

import { renderBaseCard, FONT_FAMILY } from '../common/card.js';
import { escapeXml, formatDuration } from '../common/utils.js';

import type { CodingStatsData, CardOptions, ThemeConfig } from '../types/index.js';

interface CodingStatsCardOptions extends CardOptions {
  readonly langsCount: number;
}

// ── Metric Chip ──────────────────────────────────────────────
function renderChip(
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  theme: ThemeConfig,
  delay: number,
  disableAnimations: boolean,
): string {
  const stagger = disableAnimations ? '' : `animation-delay: ${String(delay)}ms;`;
  return `
    <g class="stagger" style="${stagger}">
      <rect x="${String(x)}" y="${String(y)}" width="${String(width)}" height="42" rx="9"
            fill="#ffffff" fill-opacity="0.03"
            stroke="${theme.border}" stroke-opacity="0.5" stroke-width="1"/>
      <text x="${String(x + 13)}" y="${String(y + 16)}"
            fill="${theme.muted}" font-family="${FONT_FAMILY}" font-size="9"
            font-weight="600" letter-spacing="1.2">${escapeXml(label)}</text>
      <text x="${String(x + 13)}" y="${String(y + 33)}"
            fill="${theme.title}" font-family="${FONT_FAMILY}" font-size="15.5"
            font-weight="700" style="font-variant-numeric: tabular-nums;">${escapeXml(value)}</text>
    </g>`;
}

// ── Segmented Language Bar + horizontal legend ───────────────
function renderLanguageSection(
  languages: CodingStatsData['languages'],
  barWidth: number,
  x: number,
  y: number,
  theme: ThemeConfig,
  delay: number,
  disableAnimations: boolean,
): { svg: string; height: number } {
  const stagger = disableAnimations ? '' : `animation-delay: ${String(delay)}ms;`;

  const BAR_HEIGHT = 8;
  const SEGMENT_GAP = 3;

  // Normalize percentages to 100% total
  const totalPercent = languages.reduce((acc, l) => acc + l.percent, 0);
  const totalGap = languages.length > 1 ? (languages.length - 1) * SEGMENT_GAP : 0;
  const availableWidth = barWidth - totalGap;

  let offset = 0;
  const segments = languages
    .map((lang) => {
      const fraction = totalPercent > 0 ? lang.percent / totalPercent : 0;
      const w = availableWidth * fraction;
      const radius = Math.min(BAR_HEIGHT / 2, w / 2);
      const rect = `<rect x="${String(offset)}" y="0" rx="${String(radius)}" ry="${String(radius)}" width="${String(w)}" height="${String(BAR_HEIGHT)}" fill="${lang.color}"/>`;
      offset += w + SEGMENT_GAP;
      return rect;
    })
    .join('');

  const clipId = `cs-bar-${Math.random().toString(36).slice(2, 8)}`;
  const barReveal = disableAnimations
    ? ''
    : `<animate attributeName="width" from="0" to="${String(barWidth)}" dur="1.2s" fill="freeze" calcMode="spline" keyTimes="0; 1" keySplines="0.16 1 0.3 1" />`;

  // Horizontal legend — 4 columns per row
  const COLUMNS = 4;
  const ROW_HEIGHT = 21;
  const colWidth = barWidth / COLUMNS;
  const legendRows = Math.ceil(languages.length / COLUMNS);

  const legend = languages
    .map((lang, i) => {
      const col = i % COLUMNS;
      const row = Math.floor(i / COLUMNS);
      const lx = col * colWidth;
      const ly = row * ROW_HEIGHT;
      return `
      <g transform="translate(${String(lx)}, ${String(ly)})">
        <circle cx="4" cy="0" r="7" fill="${lang.color}" fill-opacity="0.15"/>
        <circle cx="4" cy="0" r="3.5" fill="${lang.color}"/>
        <text x="16" y="0" dominant-baseline="central"
              fill="${theme.text}" font-family="${FONT_FAMILY}" font-size="11.5"
              font-weight="500">${escapeXml(lang.name)}<tspan fill="${theme.muted}" dx="5" font-size="10.5" font-weight="600" style="font-variant-numeric: tabular-nums;">${lang.percent.toFixed(1)}%</tspan></text>
      </g>`;
    })
    .join('');

  const legendY = BAR_HEIGHT + 24;
  const height = 18 + legendY + (legendRows - 1) * ROW_HEIGHT + 14;

  const svg = `
    <g transform="translate(${String(x)}, ${String(y)})">
      <g class="stagger" style="${stagger}">
        <text x="0" y="0" fill="${theme.muted}" font-family="${FONT_FAMILY}" font-size="9"
              font-weight="600" letter-spacing="1.2">LANGUAGES</text>
        <g transform="translate(0, 10)">
          <clipPath id="${clipId}">
            <rect x="0" y="-1" width="${disableAnimations ? String(barWidth) : '0'}" height="${String(BAR_HEIGHT + 2)}">${barReveal}</rect>
          </clipPath>
          <g clip-path="url(#${clipId})">${segments}</g>
        </g>
        <g transform="translate(0, ${String(legendY + 10)})">${legend}</g>
      </g>
    </g>`;

  return { svg, height };
}

// ── Project Row ──────────────────────────────────────────────
function renderProjectRow(
  project: CodingStatsData['projects'][number],
  maxSeconds: number,
  y: number,
  maxWidth: number,
  theme: ThemeConfig,
  paddingX: number,
  delay: number,
  disableAnimations: boolean,
): string {
  const stagger = disableAnimations ? '' : `animation-delay: ${String(delay)}ms;`;
  const fraction = maxSeconds > 0 ? project.estimatedSeconds / maxSeconds : 0;
  const durationWidth = Math.max(fraction * (maxWidth + 16), 28);

  return `
    <g transform="translate(${String(paddingX)}, ${String(y)})">
      <g class="stagger" style="${stagger}">
        <rect x="-8" y="0" width="${String(durationWidth)}" height="24" rx="6"
              fill="${project.color}" fill-opacity="0.07"/>
        <circle cx="6" cy="12" r="3" fill="${project.color}"/>
        <text x="17" y="12" dominant-baseline="central"
              fill="${theme.text}" font-family="${FONT_FAMILY}" font-size="12" font-weight="500">
          ${escapeXml(project.name)}
        </text>
        <text x="${String(maxWidth)}" y="12" dominant-baseline="central"
              fill="${theme.muted}" font-family="${FONT_FAMILY}" font-size="11.5" font-weight="600"
              style="font-variant-numeric: tabular-nums;" text-anchor="end">
          ${escapeXml(formatDuration(project.estimatedSeconds))}
        </text>
      </g>
    </g>`;
}

// ── Main Renderer ────────────────────────────────────────────
export function renderCodingStatsCard(
  data: CodingStatsData,
  options: CodingStatsCardOptions,
): string {
  const { langsCount, theme, disableAnimations } = options;

  const CARD_WIDTH = 648;
  const PADDING_X = 25;
  const CONTENT_WIDTH = CARD_WIDTH - PADDING_X * 2;

  const topLangs = data.languages.slice(0, langsCount);
  const topProjects = data.projects.slice(0, 5);

  // ── Y-cursor tracking (relative to body offset) ────────────
  let cursorY = -12;

  // ── Header ─────────────────────────────────────────────────
  const headerStagger = disableAnimations ? '' : 'animation-delay: 0ms;';
  const header = `
    <g class="stagger" style="${headerStagger}">
      <rect x="${String(PADDING_X)}" y="${String(cursorY - 5)}" width="3" height="14" rx="1.5" fill="url(#accent-grad)"/>
      <text x="${String(PADDING_X + 13)}" y="${String(cursorY + 2)}"
            dominant-baseline="central"
            fill="${theme.title}" font-family="${FONT_FAMILY}"
            font-weight="600" font-size="14" letter-spacing="0.3">
        Coding Stats
      </text>
      <text x="${String(CARD_WIDTH - PADDING_X)}" y="${String(cursorY + 2)}"
            dominant-baseline="central"
            fill="${theme.muted}" font-family="${FONT_FAMILY}"
            font-size="9" font-weight="600" letter-spacing="1.2" text-anchor="end">
        ESTIMATED · LAST 7 DAYS
      </text>
    </g>`;

  cursorY += 22;

  // ── Metric Chips ───────────────────────────────────────────
  const chipY = cursorY;
  const gap = 12;
  const c1w = 160;
  const c2w = 160;
  const c3w = 120;
  const c4w = CONTENT_WIDTH - (c1w + c2w + c3w + gap * 3);

  const chips = [
    renderChip(
      PADDING_X,
      chipY,
      c1w,
      'TOTAL TIME',
      formatDuration(data.totalSeconds),
      theme,
      80,
      disableAnimations,
    ),
    renderChip(
      PADDING_X + c1w + gap,
      chipY,
      c2w,
      'DAILY AVG',
      formatDuration(data.dailyAverageSeconds),
      theme,
      160,
      disableAnimations,
    ),
    renderChip(
      PADDING_X + c1w + c2w + gap * 2,
      chipY,
      c3w,
      'SESSIONS',
      String(data.sessions),
      theme,
      240,
      disableAnimations,
    ),
    renderChip(
      PADDING_X + c1w + c2w + c3w + gap * 3,
      chipY,
      c4w,
      'ACTIVE DAYS',
      String(data.activeDays),
      theme,
      320,
      disableAnimations,
    ),
  ].join('');

  cursorY += 42 + 22; // Chip height + gap

  // ── Divider 1 ──────────────────────────────────────────────
  const divider1 = `<line x1="${String(PADDING_X)}" y1="${String(cursorY)}" x2="${String(CARD_WIDTH - PADDING_X)}" y2="${String(cursorY)}" stroke="url(#divider-grad)" stroke-width="1"/>`;
  cursorY += 20;

  // ── Language Section ───────────────────────────────────────
  let langSvg = '';
  if (topLangs.length > 0) {
    const section = renderLanguageSection(
      topLangs,
      CONTENT_WIDTH,
      PADDING_X,
      cursorY,
      theme,
      400,
      disableAnimations,
    );
    langSvg = section.svg;
    cursorY += section.height;
  }

  // ── Divider 2 ──────────────────────────────────────────────
  const divider2 =
    topProjects.length > 0
      ? `<line x1="${String(PADDING_X)}" y1="${String(cursorY)}" x2="${String(CARD_WIDTH - PADDING_X)}" y2="${String(cursorY)}" stroke="url(#divider-grad)" stroke-width="1"/>`
      : '';
  cursorY += topProjects.length > 0 ? 20 : 0;

  // ── Projects Header ────────────────────────────────────────
  const projectsHeader =
    topProjects.length > 0
      ? `<g transform="translate(${String(PADDING_X)}, ${String(cursorY)})">
        <g class="stagger" style="${disableAnimations ? '' : 'animation-delay: 480ms;'}">
          <text x="0" y="0" fill="${theme.muted}" font-family="${FONT_FAMILY}" font-size="9" font-weight="600" letter-spacing="1.2">TOP PROJECTS</text>
          <text x="${String(CONTENT_WIDTH)}" y="0" fill="${theme.muted}" font-family="${FONT_FAMILY}" font-size="9" font-weight="600" letter-spacing="1.2" text-anchor="end">TIME</text>
        </g>
      </g>`
      : '';

  cursorY += topProjects.length > 0 ? 12 : 0;

  // ── Project Rows ───────────────────────────────────────────
  const ROW_HEIGHT = 28;
  const maxProjectSeconds = topProjects.reduce((m, p) => Math.max(m, p.estimatedSeconds), 0);
  const projectRows = topProjects
    .map((project, i) => {
      const rowY = cursorY + i * ROW_HEIGHT;
      const delay = 540 + i * 70;
      return renderProjectRow(
        project,
        maxProjectSeconds,
        rowY,
        CONTENT_WIDTH,
        theme,
        PADDING_X,
        delay,
        disableAnimations,
      );
    })
    .join('');

  cursorY += topProjects.length * ROW_HEIGHT + 10;

  // ── Footer ─────────────────────────────────────────────────
  const footer = `
    <text x="${String(CARD_WIDTH / 2)}" y="${String(cursorY)}"
          fill="${theme.muted}" opacity="0.55" font-family="${FONT_FAMILY}"
          font-size="8.5" letter-spacing="0.4" text-anchor="middle">
      Estimated from GitHub events
    </text>`;

  cursorY += 18;

  // ── Assemble ───────────────────────────────────────────────
  const body = [header, chips, divider1, langSvg, divider2, projectsHeader, projectRows, footer]
    .filter(Boolean)
    .join('\n');

  const finalHeight = cursorY + 18;

  return renderBaseCard({
    body,
    options: {
      ...options,
      hideTitle: true,
      width: CARD_WIDTH,
      height: finalHeight,
    },
    title: 'Coding Stats',
    description: 'Coding stats estimated from GitHub activity',
  });
}
