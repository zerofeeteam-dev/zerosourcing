type ParsedAttribute = {
  readonly hasValue: boolean;
  readonly name: string;
  readonly nameEnd: number;
  readonly valueEnd: number;
  readonly valueStart: number;
  readonly value: string;
};

type ParsedTag = {
  readonly attributes: readonly ParsedAttribute[];
  readonly end: number;
  readonly name: string;
  readonly nameEnd: number;
  readonly start: number;
};

type ImageSlot = {
  readonly index: number;
  readonly src: ParsedAttribute | null;
  readonly srcset: ParsedAttribute | null;
  readonly tag: ParsedTag;
};

const rawTextTagNames = new Set([
  "script",
  "style",
  "textarea",
  "title",
  "xmp",
  "noembed",
  "noframes",
]);

function isAsciiWhitespace(character: string | undefined): boolean {
  return (
    character === " " ||
    character === "\n" ||
    character === "\r" ||
    character === "\t" ||
    character === "\f"
  );
}

function isTagNameCharacter(character: string | undefined): boolean {
  return character !== undefined && /[A-Za-z0-9:-]/u.test(character);
}

function isAttributeNameCharacter(character: string | undefined): boolean {
  return (
    character !== undefined &&
    !isAsciiWhitespace(character) &&
    character !== "/" &&
    character !== ">" &&
    character !== "=" &&
    character !== "<"
  );
}

function findTagEnd(source: string, start: number): number | null {
  let quote: "'" | '"' | null = null;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }
    if (character === ">") return index + 1;
  }
  return null;
}

function parseAttributes(
  source: string,
  nameEnd: number,
  end: number,
): readonly ParsedAttribute[] {
  const attributes: ParsedAttribute[] = [];
  let index = nameEnd;

  while (index < end) {
    while (
      index < end &&
      (isAsciiWhitespace(source[index]) || source[index] === "/")
    ) {
      index += 1;
    }
    if (index >= end || source[index] === ">") break;

    const nameStart = index;
    while (index < end && isAttributeNameCharacter(source[index])) index += 1;
    if (nameStart === index) {
      index += 1;
      continue;
    }
    const nameEndIndex = index;
    const name = source.slice(nameStart, nameEndIndex).toLowerCase();

    while (index < end && isAsciiWhitespace(source[index])) index += 1;
    if (source[index] !== "=") {
      attributes.push({
        hasValue: false,
        name,
        nameEnd: nameEndIndex,
        value: "",
        valueEnd: nameEndIndex,
        valueStart: nameEndIndex,
      });
      continue;
    }

    index += 1;
    while (index < end && isAsciiWhitespace(source[index])) index += 1;
    const quote = source[index];
    if (quote === "'" || quote === '"') {
      index += 1;
      const valueStart = index;
      while (index < end && source[index] !== quote) index += 1;
      const valueEnd = index;
      if (source[index] === quote) index += 1;
      attributes.push({
        hasValue: true,
        name,
        nameEnd: nameEndIndex,
        value: source.slice(valueStart, valueEnd),
        valueEnd,
        valueStart,
      });
      continue;
    }

    const valueStart = index;
    while (
      index < end &&
      !isAsciiWhitespace(source[index]) &&
      source[index] !== "/" &&
      source[index] !== ">"
    ) {
      index += 1;
    }
    attributes.push({
      hasValue: true,
      name,
      nameEnd: nameEndIndex,
      value: source.slice(valueStart, index),
      valueEnd: index,
      valueStart,
    });
  }

  return attributes;
}

function parseOpeningTag(source: string, start: number): ParsedTag | null {
  let index = start + 1;
  if (!isTagNameCharacter(source[index])) return null;

  const nameStart = index;
  while (isTagNameCharacter(source[index])) index += 1;
  const nameEnd = index;
  const end = findTagEnd(source, index);
  if (end === null) return null;
  const name = source.slice(nameStart, nameEnd).toLowerCase();

  return {
    attributes: parseAttributes(source, nameEnd, end),
    end,
    name,
    nameEnd,
    start,
  };
}

function findRawTextClosingTag(
  source: string,
  start: number,
  name: string,
): number {
  let candidate = source.indexOf("<", start);
  while (candidate >= 0) {
    if (
      source[candidate + 1] === "/" &&
      source.slice(candidate + 2, candidate + 2 + name.length).toLowerCase() ===
        name
    ) {
      const boundary = source[candidate + 2 + name.length];
      if (isAsciiWhitespace(boundary) || boundary === ">" || boundary === "/") {
        return findTagEnd(source, candidate + 2 + name.length) ?? source.length;
      }
    }
    candidate = source.indexOf("<", candidate + 1);
  }
  return source.length;
}

function scanTags(
  source: string,
  visitor: (tag: ParsedTag) => void,
): void {
  let index = 0;
  while (index < source.length) {
    const tagStart = source.indexOf("<", index);
    if (tagStart < 0) return;

    if (source.startsWith("<!--", tagStart)) {
      const commentEnd = source.indexOf("-->", tagStart + 4);
      index = commentEnd < 0 ? source.length : commentEnd + 3;
      continue;
    }
    if (source.startsWith("<!", tagStart) || source.startsWith("<?", tagStart)) {
      index = findTagEnd(source, tagStart + 2) ?? source.length;
      continue;
    }
    if (source[tagStart + 1] === "/") {
      index = findTagEnd(source, tagStart + 2) ?? source.length;
      continue;
    }

    const tag = parseOpeningTag(source, tagStart);
    if (!tag) {
      index = tagStart + 1;
      continue;
    }
    visitor(tag);
    index = tag.end;
    if (rawTextTagNames.has(tag.name)) {
      index = findRawTextClosingTag(source, index, tag.name);
    }
  }
}

function imageSlots(source: string): readonly ImageSlot[] {
  const slots: ImageSlot[] = [];
  scanTags(source, (tag) => {
    if (tag.name !== "img") return;
    const src = tag.attributes.find((attribute) => attribute.name === "src") ?? null;
    const srcset =
      tag.attributes.find((attribute) => attribute.name === "srcset") ?? null;
    slots.push({ index: slots.length, src, srcset, tag });
  });
  return slots;
}

function isEmptyImageSlot(slot: ImageSlot): boolean {
  return (
    slot.src === null ||
    !slot.src.hasValue ||
    slot.src.value.trim().length === 0
  );
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function insertAttributeBeforeTagClose(
  source: string,
  tag: ParsedTag,
  attribute: string,
): string {
  const close = source[tag.end - 2] === "/" ? tag.end - 2 : tag.end - 1;
  const separator = isAsciiWhitespace(source[close - 1]) ? "" : " ";
  return `${source.slice(0, close)}${separator}${attribute}${source.slice(close)}`;
}

function insertSourceBeforeTagClose(
  source: string,
  tag: ParsedTag,
  value: string,
): string {
  return insertAttributeBeforeTagClose(
    source,
    tag,
    `src="${escapeAttribute(value)}"`,
  );
}

type SourceReplacement = {
  readonly end: number;
  readonly start: number;
  readonly value: string;
};

function attributeValueReplacement(
  attribute: ParsedAttribute,
  value: string,
): SourceReplacement {
  const escapedValue = escapeAttribute(value);
  if (!attribute.hasValue) {
    return {
      end: attribute.nameEnd,
      start: attribute.nameEnd,
      value: `="${escapedValue}"`,
    };
  }
  return {
    end: attribute.valueEnd,
    start: attribute.valueStart,
    value: escapedValue,
  };
}

function applyReplacements(
  source: string,
  replacements: readonly SourceReplacement[],
): string {
  let output = source;
  for (const replacement of [...replacements].sort(
    (left, right) => right.start - left.start,
  )) {
    output = `${output.slice(0, replacement.start)}${replacement.value}${output.slice(replacement.end)}`;
  }
  return output;
}

export function replaceImageSlotSource(
  source: string,
  slotIndex: number,
  url: string,
): string | null {
  const slot = imageSlots(source)[slotIndex];
  if (!slot) return null;

  if (slot.src === null) {
    const withSource = insertSourceBeforeTagClose(source, slot.tag, url);
    if (slot.srcset === null) return withSource;
    return applyReplacements(withSource, [
      attributeValueReplacement(slot.srcset, ""),
    ]);
  }

  const replacements = [attributeValueReplacement(slot.src, url)];
  if (slot.srcset !== null) {
    replacements.push(attributeValueReplacement(slot.srcset, ""));
  }
  return applyReplacements(source, replacements);
}

export function replaceImagesForPreview(source: string): string {
  const slots = imageSlots(source);
  if (slots.length === 0) return source;

  let output = "";
  let cursor = 0;
  for (const slot of slots) {
    output += source.slice(cursor, slot.tag.start);
    output += isEmptyImageSlot(slot)
      ? `<button aria-label="이미지 파일 선택" data-admin-image-slot="${slot.index}" type="button">이미지 선택</button>`
      : insertAttributeBeforeTagClose(
          source.slice(slot.tag.start, slot.tag.end),
          {
            ...slot.tag,
            end: slot.tag.end - slot.tag.start,
            start: 0,
          },
          `data-admin-image-slot="${slot.index}" role="button" tabindex="0" aria-label="이미지 변경"`,
        );
    cursor = slot.tag.end;
  }
  return `${output}${source.slice(cursor)}`;
}
