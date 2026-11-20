import type { Metadata } from 'next';
import Link from 'next/link';
import { Camera, CheckCircle2, ClipboardList, MapPin } from 'lucide-react';
import SiteHeader from '@/components/layout/SiteHeader';
import Footer from '@/components/Footer';
import VermontWorkWithUsForm from '@/components/marketing/VermontWorkWithUsForm';
import { pageSocialMetadata } from '@/lib/seo/socialImages';
import { NJ_WORK_WITH_US_PATH, VERMONT_WORK_WITH_US_PATH } from '@/lib/marketing/publicCtas';

const title = 'Work with us in Vermont | VelocityMaid';
const description =
  'Professional cleaners for guest-ready homes in the Okemo Valley and Middlebury. See the areas, the checklist, photos, and the weekly pay cycle, then apply.';

export const metadata: Metadata = {
  title,
  description,
  keywords:
    'Vermont cleaner jobs, Okemo Valley cleaning jobs, Ludlow cleaner, Middlebury cleaner jobs, VelocityMaid careers',
  ...pageSocialMetadata({
    title,
    description,
    path: VERMONT_WORK_WITH_US_PATH,
    image: 'vermont',
  }),
};

const LOOKING_FOR = [
  'Steady winter-season work (Dec–Apr).',
  'A paid training job alongside the founder.',
  'An app with a checklist so you always know what\'s expected.',
] as const;

const DAY_STEPS = [
  {
    title: 'Accept the job',
    text: 'You see the property, the area, and the window before you say yes. Nothing is assigned until you accept.',
  },
  {
    title: 'Drive and work the checklist',
    text: 'Guest-ready standard — not a wipe-down. Expect 30–60 minutes between homes in the same area.',
  },
  {
    title: 'Photo every job',
    text: 'Photos close the work. That is how the host knows it is done.',
  },
  {
    title: 'Done in the app',
    text: 'Submit the job. Pay is queued on the weekly cycle after we mark it complete.',
  },
] as const;

const FAQS = [
  {
    q: 'When are pay and employment terms set?',
    a: 'Pay and employment terms are confirmed at your interview, in writing, before your first job.',
  },
  {
    q: 'When do I get paid?',
    a: 'After the job is marked complete, pay is queued. We pay on a weekly cycle. You will see ready and paid in the cleaner app.',
  },
  {
    q: 'Where do you actually need people?',
    a: 'Two areas: Okemo Valley (Ludlow, Proctorsville, Cavendish, Chester, Perkinsville) and Middlebury / Addison County. They are a long drive apart. We hire local to each area so two cleans the same day are possible.',
  },
  {
    q: 'What do I need to apply?',
    a: '18 or older, authorized to work in the US, a valid driver’s license, and a reliable car. We run a background check. Comfort driving 30–60 minutes in Vermont weather, including ski season. We confirm supplies during onboarding.',
  },
  {
    q: 'What happens after I apply?',
    a: 'If we move ahead, the next step is a paid first job together. You will hear from us by email.',
  },
] as const;

export default function VermontWorkWithUsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: 'Vermont cleaning specialist',
    description,
    datePosted: '2026-11-20',
    hiringOrganization: {
      '@type': 'Organization',
      name: 'VelocityMaid',
      sameAs: 'https://www.velocitymaid.com',
    },
    jobLocation: [
      {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Ludlow',
          addressRegion: 'VT',
          addressCountry: 'US',
        },
      },
      {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Middlebury',
          addressRegion: 'VT',
          addressCountry: 'US',
        },
      },
    ],
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'US',
    },
    directApply: true,
    url: `https://www.velocitymaid.com${VERMONT_WORK_WITH_US_PATH}`,
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main>
        <section className="bg-vm-navy px-5 pb-12 pt-10 sm:pb-16 sm:pt-14">
          <div className="mx-auto max-w-3xl">
            <p className="font-body text-xs font-bold uppercase tracking-[0.24em] text-vm-cyan">Vermont · Now hiring</p>
            <h1 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Professional cleaners who communicate clearly and take pride in a guest-ready home.
            </h1>
            <ul className="mt-6 space-y-3">
              {LOOKING_FOR.map((point) => (
                <li key={point} className="font-body text-sm leading-relaxed text-white sm:text-base">
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <a
                href="#apply"
                className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-vm-cyan px-5 font-body text-sm font-semibold text-vm-navy focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-white"
              >
                Apply for Vermont
              </a>
            </div>
          </div>
        </section>

        <section className="px-5 py-14" aria-labelledby="the-job-heading">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">The job</p>
            <h2 id="the-job-heading" className="font-heading text-3xl font-bold tracking-tight text-vm-navy">
              Guest-ready homes in two Vermont areas.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: ClipboardList,
                  title: 'A checklist on every job',
                  text: 'Guest-ready standard — not a wipe-down. The app shows what is expected before you start.',
                },
                {
                  icon: Camera,
                  title: 'Photo every job',
                  text: 'Photos close the work. That is how the host knows it is done.',
                },
                {
                  icon: MapPin,
                  title: '30–60 minutes between homes',
                  text: 'Jobs stay inside one area. We do not expect you to cover Okemo and Middlebury on the same day.',
                },
                {
                  icon: CheckCircle2,
                  title: 'Weekly pay cycle',
                  text: 'After the job is marked complete, pay is queued. We pay on a weekly cycle. You can see ready and paid in the app.',
                },
              ].map(({ icon: Icon, title: cardTitle, text }) => (
                <article key={cardTitle} className="rounded-[14px] border border-vm-border bg-vm-surface p-5">
                  <Icon className="mb-3 h-5 w-5 text-vm-cyan-dark" aria-hidden />
                  <h3 className="font-heading text-base font-bold text-vm-navy">{cardTitle}</h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-vm-muted">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-vm-surface px-5 py-14" aria-labelledby="where-heading">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">Where we hire</p>
            <h2 id="where-heading" className="font-heading text-3xl font-bold tracking-tight text-vm-navy">
              Two areas. Not all of Vermont.
            </h2>
            <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-vm-muted">
              Two cleans the same day only work when someone lives near each area. That is why we hire locally instead of promising statewide coverage.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <article className="rounded-[14px] border border-vm-border bg-white p-6">
                <p className="font-body text-[11px] font-bold uppercase tracking-widest text-vm-cyan-dark">Hiring now</p>
                <h3 className="mt-2 font-heading text-xl font-bold text-vm-navy">Okemo Valley</h3>
                <p className="mt-2 font-body text-sm text-vm-muted">Ludlow, Proctorsville, Cavendish, Chester, and nearby ski rentals.</p>
              </article>
              <article className="rounded-[14px] border border-vm-border bg-white p-6">
                <p className="font-body text-[11px] font-bold uppercase tracking-widest text-vm-cyan-dark">Hiring now</p>
                <h3 className="mt-2 font-heading text-xl font-bold text-vm-navy">Middlebury / Addison</h3>
                <p className="mt-2 font-body text-sm text-vm-muted">Middlebury and Addison County vacation homes and second homes.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-vm-navy px-5 py-14" aria-labelledby="day-heading">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan">A real day</p>
            <h2 id="day-heading" className="font-heading text-3xl font-bold tracking-tight text-white">
              Accept. Clean. Photo. Paid.
            </h2>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {DAY_STEPS.map((step, index) => (
                <li key={step.title} className="rounded-[14px] border border-white/10 bg-white/5 p-5">
                  <p className="font-body text-[10px] font-bold uppercase tracking-wider text-vm-cyan">Step {index + 1}</p>
                  <h3 className="mt-2 font-heading text-sm font-bold text-white">{step.title}</h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-white">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-5 py-14" aria-labelledby="faq-heading">
          <div className="mx-auto max-w-3xl">
            <h2 id="faq-heading" className="font-heading text-3xl font-bold tracking-tight text-vm-navy">
              Questions people ask before they apply
            </h2>
            <div className="mt-8 space-y-3">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group rounded-[14px] border border-vm-border bg-white px-5 py-4">
                  <summary className="min-h-11 cursor-pointer list-none font-heading text-sm font-bold text-vm-navy [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {faq.q}
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-vm-cyan-dark opacity-0 group-open:opacity-100" aria-hidden />
                    </span>
                  </summary>
                  <p className="mt-3 font-body text-sm leading-relaxed text-vm-text">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="apply" className="scroll-mt-24 bg-vm-surface px-5 py-14">
          <div className="mx-auto max-w-xl">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-vm-navy">Apply</h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-vm-muted">
              We read every application and reply by email. You can also write to hello@velocitymaid.com.
            </p>
            <div className="mt-6">
              <VermontWorkWithUsForm />
            </div>
            <p className="mt-6 font-body text-sm text-vm-muted">
              Applying in New Jersey?{' '}
              <Link href={NJ_WORK_WITH_US_PATH} className="font-semibold text-vm-cyan-dark underline">
                Work with us in New Jersey
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
