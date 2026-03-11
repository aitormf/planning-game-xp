/**
 * Parser for CLAUDE.md files.
 *
 * Splits a markdown document into semantic sections based on ## headings.
 * Each section gets an auto-generated slug ID and category assignment.
 */

/**
 * Generate a slug ID from a heading string.
 * Example: "Communication & Commit Guidelines" → "communication_commit_guidelines"
 *
 * @param {string} heading - The heading text (without ## prefix)
 * @param {string} [prefix='instr'] - Prefix for the slug
 * @returns {string} Slugified ID
 */
export function slugify(heading, prefix = 'instr') {
  const slug = heading
    .toLowerCase()
    .replace(/[&]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  return `${prefix}_${slug}`;
}

/**
 * Infer a category from the section heading.
 *
 * @param {string} heading - Section heading text
 * @returns {string} One of the valid global_config categories
 */
export function inferCategory(heading) {
  const lower = heading.toLowerCase();

  const categoryMap = [
    { keywords: ['architecture', 'tech stack', 'system requirements', 'environment'], category: 'architecture' },
    { keywords: ['test', 'testing'], category: 'qa' },
    { keywords: ['troubleshoot', 'maintenance', 'migration'], category: 'documentation' },
    { keywords: ['planning', 'sprint', 'workflow', 'pipeline', 'card workflow', 'wip'], category: 'planning' },
  ];

  for (const { keywords, category } of categoryMap) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }

  return 'development';
}

/**
 * Parse a CLAUDE.md file into an array of sections.
 *
 * Splits on `## ` headings (level 2). Each section includes the heading
 * and all content until the next `## ` heading or end of file.
 * The first section (before any ## heading) is captured as the "preamble".
 *
 * @param {string} markdown - Raw markdown content
 * @returns {Array<{id: string, name: string, content: string, category: string, level: number}>}
 */
export function parseSections(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return [];
  }

  const lines = markdown.split('\n');
  const sections = [];
  let currentSection = null;
  let contentLines = [];

  function flushSection() {
    if (currentSection) {
      currentSection.content = contentLines.join('\n').trim();
      if (currentSection.content || currentSection.name !== '_preamble') {
        sections.push(currentSection);
      }
    }
  }

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/);

    if (h2Match) {
      flushSection();

      const heading = h2Match[1].trim();
      currentSection = {
        id: slugify(heading),
        name: heading,
        content: '',
        category: inferCategory(heading),
        level: 2,
      };
      contentLines = [];
      continue;
    }

    // First content before any ## heading → preamble
    if (!currentSection) {
      if (line.trim()) {
        currentSection = {
          id: 'instr_preamble',
          name: '_preamble',
          content: '',
          category: 'development',
          level: 1,
        };
        contentLines = [line];
      }
      continue;
    }

    contentLines.push(line);
  }

  flushSection();
  return sections;
}

/**
 * Extract ### subsections from a section's content.
 *
 * Given a section with ### headings inside, returns an array of subsections.
 * Content before the first ### is captured as "_intro".
 * This is useful for splitting large sections (e.g., "Architecture Overview")
 * into individual guidelines.
 *
 * @param {{id: string, name: string, content: string, category: string}} section
 * @returns {Array<{id: string, name: string, content: string, category: string, level: number, parentId: string}>}
 */
export function extractSubsections(section) {
  if (!section || !section.content) return [];

  const lines = section.content.split('\n');
  const subsections = [];
  let currentSub = null;
  let subLines = [];
  let introLines = [];

  function flushSub() {
    if (currentSub) {
      currentSub.content = subLines.join('\n').trim();
      if (currentSub.content) {
        subsections.push(currentSub);
      }
    }
  }

  for (const line of lines) {
    const h3Match = line.match(/^### (.+)$/);

    if (h3Match) {
      flushSub();
      const heading = h3Match[1].trim();
      currentSub = {
        id: slugify(heading),
        name: heading,
        content: '',
        category: inferCategory(heading),
        level: 3,
        parentId: section.id,
      };
      subLines = [];
      continue;
    }

    if (!currentSub) {
      introLines.push(line);
    } else {
      subLines.push(line);
    }
  }

  flushSub();

  // If there was intro content before the first ###, add it
  const introContent = introLines.join('\n').trim();
  if (introContent && subsections.length > 0) {
    subsections.unshift({
      id: `${section.id}_intro`,
      name: `${section.name} (intro)`,
      content: introContent,
      category: section.category,
      level: 3,
      parentId: section.id,
    });
  }

  return subsections;
}

/**
 * Parse sections with optional subsection extraction for large sections.
 *
 * Works like parseSections but also splits specified sections into ### subsections.
 * Subsection headings listed in `extractFrom` are extracted from their parent
 * and returned as top-level entries.
 *
 * @param {string} markdown - Raw markdown content
 * @param {Object} [options]
 * @param {Record<string, string[]>} [options.extractFrom] - Map of parent section name → array of ### headings to extract
 * @returns {Array<{id: string, name: string, content: string, category: string, level: number}>}
 */
export function parseSectionsWithExtraction(markdown, options = {}) {
  const { extractFrom = {} } = options;
  const baseSections = parseSections(markdown);
  const result = [];

  for (const section of baseSections) {
    const extractHeadings = extractFrom[section.name];
    if (!extractHeadings || extractHeadings.length === 0) {
      result.push(section);
      continue;
    }

    const subsections = extractSubsections(section);
    const extractSet = new Set(extractHeadings);
    const extractedSubs = [];
    const remainingSubs = [];

    for (const sub of subsections) {
      if (extractSet.has(sub.name)) {
        // Promote to top-level section
        extractedSubs.push({
          ...sub,
          level: 2,
          parentId: undefined,
        });
      } else {
        remainingSubs.push(sub);
      }
    }

    // Rebuild the parent section content from remaining subsections
    if (remainingSubs.length > 0) {
      const remainingContent = remainingSubs
        .map(sub => {
          if (sub.name.endsWith('(intro)')) return sub.content;
          return `### ${sub.name}\n\n${sub.content}`;
        })
        .join('\n\n');

      result.push({
        ...section,
        content: remainingContent,
      });
    }

    // Add extracted subsections as top-level
    result.push(...extractedSubs);
  }

  return result;
}

/**
 * Parse and group sections by category.
 *
 * @param {string} markdown - Raw markdown content
 * @returns {Record<string, Array<{id: string, name: string, content: string}>>}
 */
export function parseSectionsByCategory(markdown) {
  const sections = parseSections(markdown);
  const grouped = {};

  for (const section of sections) {
    if (!grouped[section.category]) {
      grouped[section.category] = [];
    }
    grouped[section.category].push(section);
  }

  return grouped;
}
