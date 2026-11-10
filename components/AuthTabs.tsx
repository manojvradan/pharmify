import Link from "next/link";

/**
 * The "Create account / Log in" switch. It lives in the (auth) layout, so it stays mounted
 * between the two pages and the white pill slides across instead of jumping.
 *
 * Which tab is on comes from CSS, not a router hook: the page's <AuthPane> carries
 * `auth-sign-in` or `auth-sign-up`, and the `auth-on-sign-in` variant (globals.css) checks
 * the shared `group/auth` container for a *visible* sign-in pane. That keeps this a server component and prerenders the right state (a router
 * hook would need a Suspense boundary under Cache Components, so the pill would pop in late).
 * Class names are written out in full so Tailwind can find them.
 */
export function AuthTabs() {
  const tab =
    "relative z-10 grid min-h-11 place-items-center rounded-[11px] font-semibold no-underline transition-colors duration-300 hover:text-ink";
  return (
    <nav aria-label="Account" className="relative grid grid-cols-2 gap-1 rounded-[14px] bg-line-soft p-1">
      <span
        aria-hidden="true"
        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-6px)] rounded-[11px] bg-white shadow-[0_1px_2px_rgba(22,17,42,0.12)] transition-transform duration-[380ms] ease-[cubic-bezier(0.34,1.36,0.64,1)] motion-reduce:transition-none auth-on-sign-in:translate-x-[calc(100%+4px)]`}
      />
      <Link href="/sign-up" className={`${tab} text-ink auth-on-sign-in:text-subtle`}>
        Create account
      </Link>
      <Link href="/sign-in" className={`${tab} text-subtle auth-on-sign-in:text-ink`}>
        Log in
      </Link>
    </nav>
  );
}
