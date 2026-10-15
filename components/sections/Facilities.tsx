import type { FacilitiesContent } from "@/data/site";

export function Facilities({ data }: { data: FacilitiesContent }) {
  const center = data.items.find((item) => item.group === "center");

  return (
    <section className="facilities-section" aria-labelledby="facilities-title">
      <div className="content-shell mx-auto w-full max-w-[1140px] px-5">
        <h2 className="section-title" id="facilities-title">
          {data.title}
        </h2>
        <div className="facility-layout" style={{ backgroundImage: `url("${data.backgroundImage}")` }}>
          {(["left", "right"] as const).map((group) => (
            <ul className={`facility-stack facility-${group}`} key={group}>
              {data.items
                .filter((item) => item.group === group)
                .map((item) => (
                  <li className={`facility-bubble tone-${item.tone}`} key={item.id}>
                    {item.text}
                  </li>
                ))}
            </ul>
          ))}
          {center ? (
            <p className={`facility-bubble facility-center tone-${center.tone}`} key={center.id}>
              {center.text}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
