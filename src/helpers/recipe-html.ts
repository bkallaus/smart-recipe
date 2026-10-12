import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type { IngestRecipe } from '@/types/ingest';
import { htmlToRecipeText } from './ingest-helper';
import { getTotalMinutes, parseDurationMinutes } from './recipe-metadata';

type Selection = ReturnType<CheerioAPI>;

const RECIPE_ITEMTYPE_REGEX = /schema\.org\/Recipe(\s|$)/i;

// Recipe card containers from common recipe plugins
const RECIPE_CARD_SELECTORS = [
  '.wprm-recipe-container',
  '.tasty-recipes',
  '.mv-create-card',
  '.easyrecipe',
  '.zlrecipe-container',
  '.hrecipe',
  '.h-recipe',
  '[class*="recipe-card"]',
  '[id*="recipe-card"]',
];

// A card shorter than this is a link or button, not the recipe itself
const MIN_RECIPE_CARD_TEXT_LENGTH = 200;

const findMicrodataRecipe = ($: CheerioAPI): Selection =>
  $('[itemtype]')
    .filter((_, el) =>
      RECIPE_ITEMTYPE_REGEX.test($(el).attr('itemtype')?.trim() ?? ''),
    )
    .first();

// Only the properties that belong to this item, not to nested items such as
// its nutrition or rating
const getOwnProps = ($: CheerioAPI, root: Selection, names: string[]) =>
  root
    .find(names.map((name) => `[itemprop~="${name}"]`).join(', '))
    .filter((_, el) => $(el).parent().closest('[itemscope]')[0] === root[0]);

const getPropText = ($: CheerioAPI, el: Selection) =>
  (el.attr('content') ?? el.text()).replace(/\s+/g, ' ').trim();

// Durations are usually in a <meta content> or <time datetime> attribute
const getDurationMinutes = ($: CheerioAPI, root: Selection, name: string) => {
  const el = getOwnProps($, root, [name]).first();

  return parseDurationMinutes(el.attr('datetime') ?? getPropText($, el));
};

// The author is either plain text or a nested Person with its own name
const getAuthor = ($: CheerioAPI, root: Selection) => {
  const el = getOwnProps($, root, ['author']).first();
  const name = el.is('[itemscope]')
    ? getOwnProps($, el, ['name']).first()
    : el;

  return getPropText($, name.length ? name : el);
};

const getPropLines = ($: CheerioAPI, el: Selection) =>
  el.attr('content')
    ? [el.attr('content') as string]
    : htmlToRecipeText($.html(el)).split('\n');

/**
 * Reads a recipe marked up with schema.org microdata, which older recipe
 * plugins use instead of JSON-LD.
 */
export const extractMicrodataRecipe = (
  html: string,
  originalUrl: string,
  fallbackImage = '',
): IngestRecipe | null => {
  const $ = cheerio.load(html);
  const root = findMicrodataRecipe($);

  if (!root.length) {
    return null;
  }

  const ingredients = getOwnProps($, root, ['recipeIngredient', 'ingredients'])
    .toArray()
    .map((el) => getPropText($, $(el)))
    .filter(Boolean);

  if (!ingredients.length) {
    return null;
  }

  const steps = getOwnProps($, root, ['recipeInstructions'])
    .toArray()
    .flatMap((el) => getPropLines($, $(el)))
    .map((text) => ({ label: text, text }));

  const image = getOwnProps($, root, ['image']).first();
  const heroImage =
    image.attr('src') ?? image.attr('content') ?? image.attr('href') ?? '';

  const name =
    getPropText($, getOwnProps($, root, ['name']).first()) ||
    $('title').text().trim();

  const prepMinutes = getDurationMinutes($, root, 'prepTime');
  const cookMinutes = getDurationMinutes($, root, 'cookTime');

  return {
    name,
    description: getPropText($, getOwnProps($, root, ['description']).first()),
    category: getPropText($, getOwnProps($, root, ['recipeCategory']).first()),
    cuisine: getPropText($, getOwnProps($, root, ['recipeCuisine']).first()),
    keywords: getPropText($, getOwnProps($, root, ['keywords']).first()),
    heroImage: heroImage.startsWith('http') ? heroImage : fallbackImage,
    ingredients,
    steps,
    url: originalUrl,
    prepMinutes,
    cookMinutes,
    totalMinutes: getTotalMinutes(
      getDurationMinutes($, root, 'totalTime'),
      prepMinutes,
      cookMinutes,
    ),
    servings: getPropText($, getOwnProps($, root, ['recipeYield']).first()),
    author: getAuthor($, root),
  };
};

/**
 * Returns the HTML of the page's recipe card, or the whole page when no card
 * is found, so the AI fallback reads the recipe instead of the blog post and
 * comments around it.
 */
export const getRecipeSectionHtml = (html: string): string => {
  const $ = cheerio.load(html);
  const candidates = [
    findMicrodataRecipe($),
    ...RECIPE_CARD_SELECTORS.map((selector) => $(selector).first()),
  ];

  for (const card of candidates) {
    if (card.length && card.text().trim().length >= MIN_RECIPE_CARD_TEXT_LENGTH) {
      return $.html(card);
    }
  }

  return html;
};
