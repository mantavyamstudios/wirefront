const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

const HTML_ENTITY = /&(?<body>#x[\da-f]+|#\d+|[a-z]+);/giu;
const MARKDOWN_BOLD = /\*\*(?<text>.+?)\*\*/gu;
const MARKDOWN_UNDERSCORE_BOLD = /__(?<text>.+?)__/gu;
const MARKDOWN_CODE = /`(?<text>.+?)`/gu;
const MARKDOWN_HEADING = /^#+\s*/u;

const decodeHtmlEntitiesOnce = (value: string) => {
  HTML_ENTITY.lastIndex = 0;
  return value.replace(HTML_ENTITY, (entity, body: string) => {
    if (body[0] === "#") {
      const codePoint =
        body[1] === "x" || body[1] === "X"
          ? Number.parseInt(body.slice(2), 16)
          : Number(body.slice(1));

      if (Number.isNaN(codePoint) || codePoint < 0 || codePoint > 0x10_ff_ff) {
        return entity;
      }

      return String.fromCodePoint(codePoint);
    }

    return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
  });
};

const decodeHtmlEntities = (value: string) => {
  let previous = value;

  for (let i = 0; i < 3; i += 1) {
    const next = decodeHtmlEntitiesOnce(previous);
    if (next === previous) {
      return next;
    }
    previous = next;
  }

  return previous;
};

/** Decode HTML entities and strip markdown emphasis from crawled titles. */
export const plainSourceTitle = (title: string) => {
  MARKDOWN_BOLD.lastIndex = 0;
  MARKDOWN_UNDERSCORE_BOLD.lastIndex = 0;
  MARKDOWN_CODE.lastIndex = 0;

  return decodeHtmlEntities(title)
    .replace(MARKDOWN_BOLD, "$<text>")
    .replace(MARKDOWN_UNDERSCORE_BOLD, "$<text>")
    .replace(MARKDOWN_CODE, "$<text>")
    .replace(MARKDOWN_HEADING, "")
    .trim();
};
