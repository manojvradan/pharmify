import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of service" };

// Placeholder: needs legal review before launch.
export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="5 November 2026">
      <section>
        <h2>Using Pharmify</h2>
        <p>
          Pharmify is a study aid for practising pharmacy oral exams. By creating an account you agree to use it for
          personal study and to keep your sign-in details to yourself.
        </p>
      </section>
      <section>
        <h2>Not clinical or legal advice</h2>
        <p>
          The cases, feedback and flashcards are for practice only. They are not clinical, legal or professional advice,
          and may contain errors. Always rely on current official guidance and your own professional judgement.
        </p>
      </section>
      <section>
        <h2>No guarantee of exam results</h2>
        <p>
          Pharmify is independent of Ahpra and the Pharmacy Board of Australia. Its marking is an estimate and does not
          predict your result in the real exam.
        </p>
      </section>
      <section>
        <h2>Fair use</h2>
        <ul>
          <li>Don&apos;t enter real patient information.</li>
          <li>Don&apos;t copy, resell or scrape the cases or other content.</li>
          <li>Don&apos;t try to break, overload or misuse the service.</li>
        </ul>
      </section>
      <section>
        <h2>Pilot service</h2>
        <p>
          Pharmify is in pilot. Features may change, and the service may be unavailable at times. We may suspend
          accounts that break these terms.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>
    </LegalPage>
  );
}
