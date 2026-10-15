import {
  BookOpen,
  FileText,
  Mail,
  ShieldCheck,
  Sparkles,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RequirementIcon, RequirementsContent } from "@/data/site";

const icons: Record<RequirementIcon, LucideIcon> = {
  wifi: Wifi,
  document: FileText,
  mail: Mail,
  sparkles: Sparkles,
  book: BookOpen,
  shield: ShieldCheck,
};

export function Requirements({ data }: { data: RequirementsContent }) {
  return (
    <section className="requirements-section" id="requirements" aria-labelledby="requirements-title">
      <div className="content-shell mx-auto w-full max-w-[1140px] px-5">
        <h2 className="section-title" id="requirements-title">
          {data.title}
        </h2>
        <ul className="requirement-grid grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
          {data.items.map((item) => {
            const Icon = icons[item.icon];

            return (
              <li className={`requirement-item tone-${item.tone}`} key={item.id}>
                <span className="requirement-icon" aria-hidden="true">
                  <Icon size={30} strokeWidth={1.8} />
                </span>
                <p>{item.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
