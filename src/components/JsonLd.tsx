/**
 * Renders a JSON-LD block. The payload is built server-side from our own
 * catalog, never from user input, so serialising it directly is safe — we
 * still escape `<` to keep a stray sequence from closing the script tag.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
