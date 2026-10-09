import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  CalendarBlank,
  Envelope,
  FileText,
  MapPin,
  Phone,
  Scales,
  WarningCircle
} from "@phosphor-icons/react/dist/ssr";
import { Container, Section } from "@/components/ui/Container";
import { PageHero } from "@/components/PageHero";
import { LegalToc } from "@/components/marketing/LegalToc";
import { Badge } from "@/components/ui/Badge";
import {
  company,
  grievanceOfficer,
  legalDocuments,
  type LegalSection
} from "@/lib/data";

export function generateStaticParams() {
  return Object.keys(legalDocuments).map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const doc = legalDocuments[params.slug];
  if (!doc) return { title: "Legal" };
  return {
    title: `${doc.title} · ${company.brand}`,
    description: doc.description
  };
}

const otherDocs = Object.values(legalDocuments);

export default async function LegalPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const doc = legalDocuments[params.slug];
  if (!doc) notFound();

  const tocItems = doc.sections.map((s) => ({ id: s.id, heading: s.heading }));

  return (
    <>
      <PageHero
        variant="light"
        eyebrow={doc.eyebrow}
        breadcrumbs={[
          { label: "Legal", href: "/legal/privacy" },
          { label: doc.title, href: `/legal/${doc.slug}` }
        ]}
        title={doc.title}
        description={doc.description}
        className="border-b border-ink-100 pb-10 md:pb-12"
        actions={
          <div className="flex w-full flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-600">
              <span className="inline-flex items-center gap-2">
                <CalendarBlank size={16} weight="duotone" aria-hidden className="text-royal-600" />
                Last updated · <strong className="text-ink-900">{doc.lastUpdated}</strong>
              </span>
              <span className="inline-flex items-center gap-2">
                <FileText size={16} weight="duotone" aria-hidden className="text-royal-600" />
                {company.legalName}
              </span>
              <span className="inline-flex items-center gap-2">
                <Scales size={16} weight="duotone" aria-hidden className="text-royal-600" />
                CIN · {company.cin}
              </span>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Governed by
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {doc.governedBy.map((law) => (
                  <li key={law}>
                    <Badge variant="royal" size="md" className="font-medium normal-case">
                      {law}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        }
      />

      <Section className="bg-white pt-10 md:pt-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            {/* TOC */}
            <aside className="lg:col-span-3">
              <div className="lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2 scrollbar-none">
                <LegalToc items={tocItems} />
                <div className="hidden rounded-2xl border border-ink-100 bg-ink-50/60 p-4 text-sm text-ink-700 lg:mt-8 lg:block">
                  <p className="font-semibold text-ink-900">Need a signed copy?</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-600">
                    Email{" "}
                    <a
                      href={`mailto:${company.legalEmail}`}
                      className="font-medium text-royal-700 hover:underline"
                    >
                      {company.legalEmail}
                    </a>{" "}
                    for a PDF on letterhead.
                  </p>
                </div>
              </div>
            </aside>

            {/* Document */}
            <article className="lg:col-span-8 lg:col-start-5">
              <div className="space-y-14">
                {doc.sections.map((section, i) => (
                  <SectionRenderer key={section.id} section={section} index={i} />
                ))}

                {/* Always-on grievance officer card — RBI / IT Rules mandated */}
                <div
                  id="grievance-officer"
                  className="grain relative scroll-mt-32 overflow-hidden rounded-3xl bg-ink-950 p-7 text-white md:p-8"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-energy-gradient opacity-50 blur-2xl"
                  />
                  <div className="relative z-10">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white ring-1 ring-inset ring-white/15">
                        <WarningCircle size={20} weight="duotone" aria-hidden />
                      </span>
                      <div>
                        <h3 className="font-display text-xl font-semibold tracking-[-0.02em]">
                          Grievance Redressal Officer
                        </h3>
                        <p className="mt-1 text-sm text-white/60">
                          As required under Rule 5(9) of the IT (Reasonable
                          Security Practices) Rules, 2011 and Rule 3(2) of the IT
                          (Intermediary Guidelines) Rules, 2021.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                          Officer
                        </p>
                        <p className="mt-1 font-medium">{grievanceOfficer.name}</p>
                        <p className="text-white/60">{grievanceOfficer.designation}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                          Service hours
                        </p>
                        <p className="mt-1 text-white/80">{grievanceOfficer.hours}</p>
                      </div>
                      <div className="space-y-2 text-white/80">
                        <p className="flex items-center gap-2">
                          <Envelope size={16} weight="duotone" aria-hidden className="text-brand-300" />
                          <a href={`mailto:${grievanceOfficer.email}`} className="hover:underline">
                            {grievanceOfficer.email}
                          </a>
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone size={16} weight="duotone" aria-hidden className="text-brand-300" />
                          {grievanceOfficer.phone}
                        </p>
                      </div>
                      <div className="text-white/80">
                        <p className="flex items-start gap-2">
                          <MapPin size={16} weight="duotone" aria-hidden className="mt-0.5 shrink-0 text-brand-300" />
                          <span>{grievanceOfficer.address}</span>
                        </p>
                      </div>
                    </div>

                    <p className="mt-6 rounded-xl bg-white/[0.06] px-4 py-3 text-xs text-white/70 ring-1 ring-inset ring-white/10">
                      {grievanceOfficer.responseSla}.
                    </p>
                  </div>
                </div>

                {/* Cross-links */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Related documents
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {otherDocs
                      .filter((d) => d.slug !== doc.slug)
                      .map((d) => (
                        <Link
                          key={d.slug}
                          href={`/legal/${d.slug}`}
                          className="gradient-ring group flex items-start justify-between gap-4 rounded-2xl border border-ink-100 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-energy-sm focus-energy"
                        >
                          <div>
                            <p className="font-display font-semibold tracking-[-0.01em] text-ink-950 group-hover:text-royal-800">
                              {d.title}
                            </p>
                            <p className="mt-1 text-xs text-ink-500">{d.eyebrow}</p>
                          </div>
                          <ArrowUpRight
                            size={16}
                            weight="bold"
                            aria-hidden
                            className="shrink-0 text-ink-400 transition group-hover:text-royal-700"
                          />
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            </article>
          </div>
        </Container>
      </Section>
    </>
  );
}

function SectionRenderer({ section, index }: { section: LegalSection; index: number }) {
  return (
    <section id={section.id} className="scroll-mt-32">
      <div className="flex items-baseline gap-4">
        <span className="hidden shrink-0 font-display text-sm font-semibold tabular-nums text-ink-300 sm:block">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink-950 md:text-3xl">
          {section.heading}
        </h2>
      </div>
      <div className="mt-5 space-y-5 text-[15px] leading-[1.75] text-ink-700 sm:pl-10">
        {section.body.map((block, i) => {
          if (typeof block === "string") {
            return <p key={i}>{block}</p>;
          }
          if ("list" in block) {
            return (
              <ul key={i} className="space-y-2.5">
                {block.list.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-energy-gradient"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          }
          if ("table" in block) {
            return (
              <div key={i} className="overflow-hidden rounded-2xl border border-ink-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-ink-950 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                      <tr>
                        {block.table.headers.map((h) => (
                          <th key={h} scope="col" className="px-4 py-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100 text-ink-700">
                      {block.table.rows.map((row, ri) => (
                        <tr key={ri} className="odd:bg-white even:bg-ink-50/50">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-4 py-3 align-top">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </section>
  );
}
