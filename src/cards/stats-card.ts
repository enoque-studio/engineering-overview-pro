// ============================================================
// Stats card — pure SVG renderer
// ============================================================

import { renderBaseCard, FONT_FAMILY } from '../common/card.js';
import { escapeXml, formatNumber } from '../common/utils.js';
import { t } from '../common/i18n.js';
import { iconCommit, iconContributions, iconRepo, iconCode } from '../common/icons.js';

import type { UserStats, CardOptions } from '../types/index.js';

interface StatsCardOptions extends CardOptions {
  readonly hideRank: boolean;
  readonly lineHeight: number;
  readonly hideItems: ReadonlyArray<string>;
  readonly showItems: ReadonlyArray<string>;
}

interface StatItem {
  readonly key: string;
  readonly icon: string;
  readonly label: string;
  readonly value: string;
}

/**
 * Build the list of stat items based on visibility config.
 */
function buildStatItems(stats: UserStats, options: StatsCardOptions): ReadonlyArray<StatItem> {
  const { locale, theme } = options;

  const allItems: ReadonlyArray<StatItem> = [
    {
      key: 'commits',
      icon: iconCommit(theme.icon),
      label: t('stats.commits', locale),
      value: formatNumber(stats.totalCommits),
    },
    {
      key: 'repos',
      icon: iconRepo(theme.icon),
      label: locale === 'pt-br' ? 'Repositórios' : 'Repositories',
      value: formatNumber(stats.totalRepos),
    },
    {
      key: 'active_repos',
      icon: iconCode(theme.icon),
      label: locale === 'pt-br' ? 'Repos Ativos (Ano)' : 'Active Repos (Year)',
      value: formatNumber(stats.activeRepos),
    },
    {
      key: 'followers',
      icon: iconContributions(theme.icon),
      label: locale === 'pt-br' ? 'Seguidores' : 'Followers',
      value: formatNumber(stats.followers),
    },
  ];

  return allItems.filter((item) => {
    // If show list is specified, only show those
    if (options.showItems.length > 0) {
      return options.showItems.includes(item.key);
    }
    // Otherwise, hide items in the hide list
    return !options.hideItems.includes(item.key);
  });
}

/**
 * Render the rank circle SVG element.
 */
function renderRankCircle(
  rank: UserStats['rank'],
  theme: CardOptions['theme'],
  disabled: boolean,
): string {
  const CIRCLE_RADIUS = 54;
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
  const progress = ((100 - rank.percentile) / 100) * CIRCLE_CIRCUMFERENCE;
  const finalOffset = CIRCLE_CIRCUMFERENCE - progress;

  const animationStyle = disabled
    ? `opacity: 1; stroke-dashoffset: ${String(finalOffset)};`
    : `animation: rankAnimation 1.2s cubic-bezier(0.16, 1, 0.3, 1) 250ms forwards; stroke-dashoffset: ${String(CIRCLE_CIRCUMFERENCE)};`;

  const animationKeyframes = disabled
    ? ''
    : `
    @keyframes rankAnimation {
      to { stroke-dashoffset: ${String(finalOffset)}; }
    }
    @media (prefers-reduced-motion: reduce) {
      .rank-arc { animation: none !important; stroke-dashoffset: ${String(finalOffset)} !important; }
    }`;

  return `
    <g transform="translate(0, 0)">
      <style>${animationKeyframes}</style>
      <defs>
        <linearGradient id="rank-arc-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${theme.icon}" />
          <stop offset="100%" stop-color="${theme.purple}" />
        </linearGradient>
        <filter id="rank-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
        </filter>
      </defs>
      <circle cx="0" cy="0" r="${String(CIRCLE_RADIUS)}"
        fill="none"
        stroke="${theme.border}"
        stroke-width="7"
        stroke-opacity="0.35" />
      <circle class="rank-arc" cx="0" cy="0" r="${String(CIRCLE_RADIUS)}"
        fill="none"
        stroke="${theme.rankCircle}"
        stroke-width="7"
        stroke-opacity="0.4"
        stroke-linecap="round"
        stroke-dasharray="${String(CIRCLE_CIRCUMFERENCE)}"
        style="${animationStyle}"
        transform="rotate(-90)"
        filter="url(#rank-glow)" />
      <circle class="rank-arc" cx="0" cy="0" r="${String(CIRCLE_RADIUS)}"
        fill="none"
        stroke="url(#rank-arc-grad)"
        stroke-width="7"
        stroke-linecap="round"
        stroke-dasharray="${String(CIRCLE_CIRCUMFERENCE)}"
        style="${animationStyle}"
        transform="rotate(-90)" />
      <text x="0" y="-7"
        text-anchor="middle"
        dominant-baseline="central"
        fill="${theme.title}"
        font-size="36" font-weight="800"
        letter-spacing="-0.5"
        font-family="${FONT_FAMILY}">
        ${escapeXml(rank.level)}
      </text>
      <text x="0" y="22"
        class="micro-label"
        text-anchor="middle"
        dominant-baseline="central"
        fill="${theme.muted}"
        font-family="${FONT_FAMILY}">
        TOP ${String(rank.percentile)}%
      </text>
    </g>`;
}

/**
 * Render stats card SVG.
 * Pure function: (data, options) => string.
 */
export function renderStatsCard(stats: UserStats, options: StatsCardOptions): string {
  const { theme, locale, disableAnimations, lineHeight } = options;

  const items = buildStatItems(stats, options);
  const CARD_WIDTH = 495;
  const CARD_PADDING_TOP = 10;
  // Calculate left column right edge (approx 250px) to determine right column center
  const rightColumnCenter = 250 + (CARD_WIDTH - 250) / 2;
  const RANK_CIRCLE_X = rightColumnCenter;
  const RANK_CIRCLE_Y =
    CARD_PADDING_TOP + ((items.length > 0 ? items.length - 1 : 0) * lineHeight) / 2;

  // Render stat rows — icon chip + label + right-aligned value
  const statRows = items
    .map((item, index) => {
      const y = CARD_PADDING_TOP + index * lineHeight;
      const delay = 100 + index * 120;
      const staggerStyle = disableAnimations ? '' : `animation-delay: ${String(delay)}ms;`;

      return `
      <g transform="translate(25, ${String(y)})">
        <g class="stagger" style="${staggerStyle}">
          <rect x="0" y="-4" width="24" height="24" rx="7"
            fill="${theme.icon}" fill-opacity="0.08"
            stroke="${theme.icon}" stroke-opacity="0.16" stroke-width="1" />
          <g transform="translate(4, 0)">
            ${item.icon}
          </g>
          <text x="36" y="8"
            class="stat-label"
            dominant-baseline="central"
            fill="${theme.text}">
            ${escapeXml(item.label)}
          </text>
          <text x="${options.hideRank ? '220' : '196'}" y="8"
            class="stat-value"
            dominant-baseline="central"
            fill="${theme.title}"
            text-anchor="end">
            ${escapeXml(item.value)}
          </text>
        </g>
      </g>`;
    })
    .join('');

  // Rank circle (if not hidden)
  const rankSection = options.hideRank
    ? ''
    : `<g transform="translate(${String(RANK_CIRCLE_X)}, ${String(RANK_CIRCLE_Y)})">
        ${renderRankCircle(stats.rank, theme, disableAnimations)}
      </g>`;

  const bodyOffset = options.hideTitle ? 30 : 55;
  const paddingBottom = 26;
  const lastItemY = items.length > 0 ? CARD_PADDING_TOP + (items.length - 1) * lineHeight : 0;
  const cardHeight = Math.max(
    bodyOffset + lastItemY + 16 + paddingBottom,
    options.hideRank ? 140 : 170,
  );

  const body = `
    ${statRows}
    ${rankSection}
  `;

  const title = options.customTitle ?? t('stats.title', locale);

  return renderBaseCard({
    body,
    options: { ...options, width: CARD_WIDTH, height: cardHeight },
    title,
    description: `${escapeXml(stats.username)}'s GitHub Stats`,
  });
}
