import Link from "next/link";
import { ArrowUpRight, Clock } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { blogPosts } from "@/lib/data";
import { SectionHeading } from "./_shared/SectionHeading";

/** Server component — three editorial teasers with oversized index numerals. */
export function InsightsPreview() {
  return (
    <section
      id="blog"
      className="scroll-mt-20 bg-[#f6f7fb] py-20 md:py-28"
      aria-labelledby="insights-heading"
    >
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow="Insights"
            title={<span id="insights-heading">What the best counters do differently.</span>}
            sub="Short reads from shops that earn more — with the numbers to prove it."
          />
        </Reveal>

        <Stagger className="mt-12 grid gap-5 md:grid-cols-3" stagger={0.08}>
          {blogPosts.map((p, i) => (
            <StaggerItem key={p.slug} className="h-full">
              <Link
                href={`/blog/${p.slug}`}
                className="group focus-energy relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white p-7 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-energy"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-3 -top-6 font-display text-[7rem] font-semibold leading-none tracking-[-0.05em] text-ink-100 transition-colors group-hover:text-royal-100"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="relative">
                  <Badge variant={i === 0 ? "coral" : i === 1 ? "royal" : "brand"} size="sm">
                    {p.category}
                  </Badge>
                </div>

                <h3 className="relative mt-5 font-display text-xl font-semibold leading-snug tracking-[-0.02em] text-ink-950 md:text-2xl">
                  {p.title}
                </h3>
                <p className="relative mt-3 line-clamp-3 text-sm leading-relaxed text-ink-600">
                  {p.excerpt}
                </p>

                <div className="relative mt-auto flex items-center justify-between pt-7 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={13} weight="duotone" aria-hidden />
                    {p.readTime} · {p.date}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-ink-800 transition-colors group-hover:text-royal-700">
                    Read
                    <ArrowUpRight
                      size={14}
                      weight="bold"
                      aria-hidden
                      className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
