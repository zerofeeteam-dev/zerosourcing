import { serializeJsonLd } from "../lib/seo/structured-data";

type JsonLdProps = {
  readonly data: unknown;
  readonly id: string;
};

export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
      id={id}
      type="application/ld+json"
    />
  );
}
