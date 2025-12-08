// FAQSection.tsx
import { Button } from "./ui";

const faqs = [
  {
    q: "Do I need to download an app to book a ride?",
    a: "No. You can book, track, and manage your rides directly from this web experience in under a minute.",
  },
  {
    q: "How are drivers vetted?",
    a: "Every driver passes identity verification, vehicle checks, and ongoing quality reviews before driving on Our Common Commute.",
  },
  {
    q: "Can I use the same account as a rider and a driver?",
    a: "Yes. You can switch between rider and driver dashboards with one account once your driver profile is approved.",
  },
  {
    q: "How do payouts work for drivers?",
    a: "Earnings are tracked in real-time in your dashboard and paid out on a regular schedule to your connected payout method.",
  },
  {
    q: "Is support available if there’s an issue with a trip?",
    a: "Absolutely. Our support team is available around the clock to help resolve trip issues and safety concerns.",
  },
];

export default function FAQSection() {
  return (
    <section
      id="support"
      className="bg-gradient-to-b from-[#eaf1ff] via-[#e5efff] to-[#f5f8ff] py-16 scroll-mt-24 sm:py-20"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <header className="mb-10 text-center sm:mb-12">
          <h2 className="text-[26px] font-bold tracking-tight text-slate-900 sm:text-[52px]">
            Got Questions? We&apos;ve Got Answers
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">
            Whether you&apos;re booking your first ride or exploring our web app
            features, our FAQs cover everything you need to ride with confidence.
          </p>
        </header>

        {/* FAQ rows – Figma-style pills */}
        <div className="space-y-3 sm:space-y-4">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-left 
                         text-[14px] font-medium text-slate-900 shadow-[0_14px_40px_rgba(15,23,42,0.06)]
                         ring-1 ring-slate-200/70 sm:px-5 sm:py-4"
            >
              <span className="pr-4">{item.q}</span>

              {/* plus icon badge on the right */}
              <span
                className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center 
                           rounded-full bg-[#0B63F4] text-xs font-bold text-white 
                           shadow-[0_10px_22px_rgba(37,99,235,0.45)]"
              >
                +
              </span>
            </div>
          ))}
        </div>

        {/* See more button */}
        <div className="mt-8 flex justify-center">
          <Button className="h-11 min-w-[160px] rounded-full px-8 text-[14px]">
            See more
          </Button>
        </div>
      </div>
    </section>
  );
}
