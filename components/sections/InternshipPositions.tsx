import type { ListSectionContent } from "@/data/site";

export function InternshipPositions({ data }: { data: ListSectionContent }) {
  return (
    <section className="positions-section" aria-labelledby="positions-title">
      <div className="content-shell mx-auto w-full max-w-[1140px] px-5">
        <h2 className="section-title" id="positions-title">
          {data.title}
        </h2>
        <ul className="positions-grid grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {data.items.map((position) => (
            <li className="position-item" key={position.id}>
              {position.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
