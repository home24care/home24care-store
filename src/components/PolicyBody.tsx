import type { Block, Section } from '@/lib/policy-types';

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case 'p':
      return <p key={key}>{block.text}</p>;

    case 'h3':
      return <h3 key={key}>{block.text}</h3>;

    case 'ul':
      return (
        <ul key={key}>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );

    case 'ol':
      return (
        <ol key={key}>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );

    case 'table':
      return (
        // Wide tables must scroll inside themselves, never widen the page.
        <div key={key} className="mb-5 overflow-x-auto">
          <table>
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'callout':
      return (
        <aside
          key={key}
          className="my-5 rounded-xl border border-clay-200 bg-clay-50 p-4 text-[14px] leading-relaxed text-clay-900"
        >
          <p className="font-semibold">{block.title}</p>
          <p className="mt-1">{block.text}</p>
        </aside>
      );
  }
}

export default function PolicyBody({ sections }: { sections: Section[] }) {
  return (
    <div className="prose-policy">
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-28">
          <h2>{section.heading}</h2>
          {section.blocks.map(renderBlock)}
        </section>
      ))}
    </div>
  );
}
