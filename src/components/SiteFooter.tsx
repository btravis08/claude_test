import { Logo } from "@/components/Logo";

const columns: { heading: string; links: string[] }[] = [
  {
    heading: "Support",
    links: ["Help & FAQs", "Returns & Exchanges", "Warranty", "Contact Us"],
  },
  {
    heading: "Company",
    links: ["The Legacy", "TEAM SUN DAY RED", "Honors Journal", "Careers"],
  },
  {
    heading: "More",
    links: ["Gift Cards", "ID.me"],
  },
];

const social = ["FB", "TT", "IG", "X", "TW"];

export function SiteFooter() {
  return (
    <footer data-mode="light" className="mt-auto bg-surface text-ink">
      {/* legacy video band */}
      <div className="relative h-[428px] w-full overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-surface-2 bg-cover bg-center"
          style={{ backgroundImage: "url(/figma/legacy-video.jpg)" }}
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Earned Never Given wordmark art */}
      <div className="flex h-[526px] w-full items-center justify-center overflow-hidden p-2.5">
        <div className="relative h-[151px] w-[486px] shrink-0 scale-75 sm:scale-100">
          <p className="absolute left-[132px] top-0 whitespace-nowrap font-display text-display-xl">
            Earned
          </p>
          <p className="absolute left-0 top-[54.5px] whitespace-nowrap font-display text-display-xl">
            Never
          </p>
          <p className="absolute left-[300px] top-[57.5px] whitespace-nowrap font-display text-display-xl">
            Given
          </p>
          <span
            aria-hidden
            className="absolute left-[194px] top-[91.5px] inline-block h-[20.7px] w-[62.7px] bg-current"
            style={{
              maskImage: "url(/figma/union-swoosh.svg)",
              maskSize: "100% 100%",
              maskRepeat: "no-repeat",
              WebkitMaskImage: "url(/figma/union-swoosh.svg)",
              WebkitMaskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
            }}
          />
          <p className="label absolute left-0 top-[135.5px] font-medium">SUN DAY</p>
          <p className="label absolute left-[143px] top-[135.5px] font-medium">EST</p>
          <p className="label absolute left-[287px] top-[135.5px] font-medium">2024</p>
          <p className="label absolute right-0 top-[135.5px] font-medium">RED</p>
        </div>
      </div>

      {/* link columns */}
      <div className="grid w-full grid-cols-1 border-t-[1.5px] border-line sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => (
          <div
            key={col.heading}
            className="flex flex-col gap-[18px] border-b border-l border-line px-6 pb-16 pt-6"
          >
            <p className="label font-medium opacity-70">{col.heading}</p>
            <div className="flex flex-col gap-[9px]">
              {col.links.map((link) => (
                <a key={link} href="#" className="label font-medium hover:opacity-70">
                  {link}
                </a>
              ))}
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-[18px] border-b border-l border-line px-6 pb-16 pt-6">
          <Logo />
          <p className="text-[12px] uppercase leading-none">
            Maecenas suspendisse ultrices pellentesque et ornare dui nisl. Eget
            convallis lorem faucibus tortor in.
          </p>
        </div>
      </div>

      {/* newsletter */}
      <form className="flex w-full flex-col items-stretch gap-3 p-6 sm:flex-row sm:gap-0">
        <label className="flex h-10 flex-1 items-center bg-wash pl-4 pr-3 backdrop-blur-[12px]">
          <span className="sr-only">Email address</span>
          <input
            type="email"
            placeholder="EMAIL ADDRESS"
            className="label w-full bg-transparent font-medium text-ink outline-none placeholder:text-ink-3"
          />
        </label>
        <button
          type="submit"
          className="label flex h-10 min-w-[150px] flex-1 items-center justify-center bg-btn px-3.5 font-medium text-btn-fg transition-opacity hover:opacity-80"
        >
          Submit
        </button>
      </form>

      {/* bottom bar */}
      <div className="flex w-full flex-col gap-6 px-6 py-8 sm:h-[72px] sm:flex-row sm:items-start sm:gap-8">
        <div className="flex flex-1 items-center">
          <p className="label font-medium">©2026 SUN DAY RED</p>
        </div>
        <div className="flex flex-1 items-center justify-between gap-4">
          {social.map((s) => (
            <a key={s} href="#" className="label font-medium hover:opacity-70">
              {s}
            </a>
          ))}
          <a href="#top" className="label font-medium hover:opacity-70">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
