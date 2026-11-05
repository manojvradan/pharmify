import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy policy" };

// Placeholder: needs review against the Privacy Act 1988 (Cth) and the Australian Privacy Principles before launch.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="5 November 2026">
      <section>
        <h2>Who we are</h2>
        <p>
          Pharmify is an independent practice tool for pharmacy interns preparing for oral exams. It is not affiliated
          with Ahpra or the Pharmacy Board of Australia.
        </p>
      </section>
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Your account details (name, email, and Google profile if you sign in with Google), held by our sign-in provider, Clerk.</li>
          <li>Your onboarding answers, such as your state or territory, exam sitting and internship stage.</li>
          <li>Your practice sessions: the transcript of what you say, the role-play replies, and the feedback report.</li>
          <li>Basic usage data, such as when sessions start and end, used to keep the service running and costs in check.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>
          To run your practice sessions, mark them, show your history, and improve the cases. Session transcripts are
          sent to our AI provider (Anthropic) to generate the role-play replies and your feedback. We don&apos;t sell
          your data or use it for advertising.
        </p>
      </section>
      <section>
        <h2>Where it&apos;s stored</h2>
        <p>
          Data is stored with our service providers (Clerk, Neon and Vercel), which may hold it outside Australia.
        </p>
      </section>
      <section>
        <h2>Please don&apos;t enter real patient information</h2>
        <p>All cases are fictional. Don&apos;t type or say anything that identifies a real person.</p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>
          You can ask to see, correct or delete your data at any time by emailing{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>
    </LegalPage>
  );
}
