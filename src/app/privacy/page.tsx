import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — LankaPros',
  description: 'LankaPros privacy policy. Learn how we collect, use, and protect your data on Sri Lanka\'s professional network.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-20">
        <Link href="/" className="text-accent hover:text-accent-hover text-sm mb-8 inline-block">&larr; Back to home</Link>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted text-sm mb-10">Last updated: March 1, 2026</p>

        <div className="space-y-8 text-muted leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Introduction</h2>
            <p>
              LankaPros (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates lankapros.com, a social and professional network
              for Sri Lankan professionals. This Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Information We Collect</h2>
            <p className="mb-2">We collect information you provide directly, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Account information:</strong> name, email address, password, industry, and location when you sign up.</li>
              <li><strong className="text-foreground">Profile data:</strong> profile photo, bio, work history, education, skills, and any customization (themes, colors).</li>
              <li><strong className="text-foreground">User-generated content:</strong> posts, comments, articles, images, and other content you create or share.</li>
              <li><strong className="text-foreground">Messaging data:</strong> messages sent and received through the platform&rsquo;s messaging feature.</li>
              <li><strong className="text-foreground">Connections:</strong> your network of professional connections and group memberships.</li>
            </ul>
            <p className="mt-3 mb-2">We also collect information automatically:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Device type, browser type, IP address, and operating system.</li>
              <li>Pages visited, features used, and time spent on the platform.</li>
              <li>Cookies and similar tracking technologies for authentication and analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide, maintain, and improve the LankaPros platform.</li>
              <li>To create and manage your account and professional profile.</li>
              <li>To facilitate connections, messaging, and group participation.</li>
              <li>To personalize your experience, including content recommendations.</li>
              <li>To send service-related notifications (connection requests, messages, platform updates).</li>
              <li>To detect, prevent, and address fraud, abuse, or security issues.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Sharing of Information</h2>
            <p className="mb-2">We do not sell your personal data. We may share information:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Public profile:</strong> your profile information (name, photo, bio, work history) is visible to other users by default. You can control visibility in your settings.</li>
              <li><strong className="text-foreground">Service providers:</strong> with trusted third-party providers who assist in operating the platform (hosting, analytics, email delivery).</li>
              <li><strong className="text-foreground">Legal requirements:</strong> when required by law, regulation, or legal process.</li>
              <li><strong className="text-foreground">Business transfers:</strong> in connection with a merger, acquisition, or sale of assets.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide services.
              When you delete your account, we will delete or anonymize your personal data within 30 days,
              except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Your Rights (GDPR &amp; International Users)</h2>
            <p className="mb-2">If you are located in the European Economic Area (EEA), UK, or other jurisdictions with data protection laws, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Access</strong> your personal data.</li>
              <li><strong className="text-foreground">Rectify</strong> inaccurate or incomplete data.</li>
              <li><strong className="text-foreground">Erase</strong> your data (&ldquo;right to be forgotten&rdquo;).</li>
              <li><strong className="text-foreground">Restrict</strong> processing of your data.</li>
              <li><strong className="text-foreground">Data portability:</strong> receive your data in a structured, machine-readable format.</li>
              <li><strong className="text-foreground">Object</strong> to processing based on legitimate interests.</li>
              <li><strong className="text-foreground">Withdraw consent</strong> at any time where processing is based on consent.</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at privacy@lankapros.com.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. We may use analytics cookies
              to understand how users interact with the platform. You can manage cookie preferences through
              your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including encryption
              in transit (HTTPS) and at rest. However, no method of electronic storage is 100% secure,
              and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Children&rsquo;s Privacy</h2>
            <p>
              LankaPros is not intended for users under the age of 16. We do not knowingly collect personal
              information from children. If we learn that we have collected data from a child under 16,
              we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes
              by posting a notice on the platform or sending an email. Your continued use of LankaPros
              after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or your data, contact us at:<br />
              <a href="mailto:privacy@lankapros.com" className="text-accent hover:text-accent-hover">privacy@lankapros.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
