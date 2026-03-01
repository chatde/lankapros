import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — LankaPros',
  description: 'LankaPros terms of service. Rules for using Sri Lanka\'s professional network.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-20">
        <Link href="/" className="text-accent hover:text-accent-hover text-sm mb-8 inline-block">&larr; Back to home</Link>
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted text-sm mb-10">Last updated: March 1, 2026</p>

        <div className="space-y-8 text-muted leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using LankaPros (&ldquo;the Platform&rdquo;), operated at lankapros.com, you agree to be bound
              by these Terms of Service. If you do not agree to these terms, do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Eligibility</h2>
            <p>
              You must be at least 16 years old to use LankaPros. By creating an account, you represent
              that you meet this age requirement and that the information you provide is accurate.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Your Account</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You must provide accurate, current, and complete information in your profile.</li>
              <li>You may not create multiple accounts or accounts for other people without permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. User-Generated Content</h2>
            <p className="mb-2">
              You retain ownership of content you post on LankaPros. By posting content, you grant us a
              non-exclusive, worldwide, royalty-free license to use, display, reproduce, and distribute
              your content on the Platform for the purpose of operating and promoting the service.
            </p>
            <p>You agree that your content will not:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Violate any applicable law or regulation.</li>
              <li>Infringe upon the intellectual property rights of others.</li>
              <li>Contain false, misleading, or fraudulent information.</li>
              <li>Include harassment, hate speech, threats, or discriminatory content.</li>
              <li>Contain spam, malware, or unauthorized advertising.</li>
              <li>Impersonate another person or entity.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Community Guidelines</h2>
            <p>LankaPros is a professional network. Users must:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Treat all members with respect and professionalism.</li>
              <li>Use real identities and accurate professional information.</li>
              <li>Refrain from unsolicited commercial messages or spam.</li>
              <li>Report violations of these guidelines to our team.</li>
              <li>Respect the diversity of Sri Lanka&rsquo;s professional community across all 19 industries.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Account Termination</h2>
            <p className="mb-2">We may suspend or terminate your account if you:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Violate these Terms of Service or Community Guidelines.</li>
              <li>Engage in fraudulent, abusive, or illegal activity.</li>
              <li>Create a risk of harm to other users or the Platform.</li>
            </ul>
            <p className="mt-2">
              You may delete your account at any time through your account settings. Upon deletion,
              your profile, posts, and personal data will be removed within 30 days, subject to our
              Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Data Portability</h2>
            <p>
              You have the right to request a copy of your data in a structured, machine-readable format.
              This includes your profile information, posts, connections, and messages. To request a data
              export, contact us at privacy@lankapros.com.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Intellectual Property</h2>
            <p>
              The LankaPros name, logo, design, and all platform features are the intellectual property
              of LankaPros and its licensors. You may not copy, modify, distribute, or reverse-engineer
              any part of the Platform without our written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Disclaimer of Warranties</h2>
            <p>
              LankaPros is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either
              express or implied. We do not guarantee that the Platform will be uninterrupted, secure,
              or error-free. We are not responsible for the accuracy of user-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, LankaPros shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of the Platform,
              including loss of data, revenue, or business opportunities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes
              via the Platform or email. Continued use of LankaPros after changes constitutes
              acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              United States, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">13. Contact Us</h2>
            <p>
              If you have questions about these Terms of Service, contact us at:<br />
              <a href="mailto:legal@lankapros.com" className="text-accent hover:text-accent-hover">legal@lankapros.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
