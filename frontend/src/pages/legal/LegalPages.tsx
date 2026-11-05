import type { ReactNode } from 'react'
import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Logo } from '../../components/layout/Logo'

const LAST_UPDATED = 'October 31, 2026'

function LegalLayout({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow: string
  title: string
  summary: string
  children: ReactNode
}) {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-[72px] w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo to={user ? '/dashboard' : '/signin'} />
          <Link
            to={user ? '/dashboard' : '/signin'}
            className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-600 transition hover:text-brand-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {user ? 'Back to dashboard' : 'Back to sign in'}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700">
          <ShieldCheck className="h-3 w-3" />
          {eyebrow}
        </div>
        <h1 className="mt-4 text-[34px] font-bold leading-tight tracking-[-0.045em] text-ink">
          {title}
        </h1>
        <p className="mt-3 text-[13px] leading-7 text-muted">{summary}</p>
        <p className="mt-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-slate-400">
          Last updated {LAST_UPDATED}
        </p>

        <div className="mt-8 space-y-6">{children}</div>
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-4 py-5 text-[10.5px] text-slate-400 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} E-Drive Cloud. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <Link to="/terms" className="font-medium transition hover:text-brand-600">
              Terms of Service
            </Link>
            <Link to="/privacy" className="font-medium transition hover:text-brand-600">
              Privacy Policy
            </Link>
            <span className="inline-flex items-center gap-1">
              <LockKeyhole className="h-3 w-3" />
              Encrypted by default
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-[14px] font-bold tracking-[-0.01em] text-ink">{title}</h2>
      <div className="mt-2.5 space-y-2.5 text-[12px] leading-6 text-slate-600">{children}</div>
    </section>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Terms of Service"
      summary="These terms explain the rules for using E-Drive Cloud, the responsibilities that come with your vault, and how our storage plans work."
    >
      <Section title="1. Acceptance of these terms">
        <p>
          By creating an account or using E-Drive Cloud, you agree to these Terms of Service and our
          Privacy Policy. If you do not agree, do not use the service. If you use E-Drive on behalf of an
          organisation, you confirm that you have authority to accept these terms for that organisation.
        </p>
      </Section>

      <Section title="2. Your account">
        <Bullets
          items={[
            'You must provide accurate account information and keep it up to date.',
            'You are responsible for safeguarding your master password and any devices signed in to your vault.',
            'You must be at least 16 years old, or the minimum age required in your jurisdiction, to use E-Drive.',
            'Notify us immediately if you believe your account or a share link has been compromised.',
            'One person or organisation may not maintain multiple accounts to evade storage or usage limits.',
          ]}
        />
      </Section>

      <Section title="3. Acceptable use">
        <p>You agree not to use E-Drive to:</p>
        <Bullets
          items={[
            'Store or share content that infringes intellectual property, privacy or other rights.',
            'Upload malware, conduct phishing, or attempt to gain unauthorised access to any system.',
            'Harass, threaten or defraud another person, or violate applicable law.',
            'Probe, scan or test the security of the service without written permission.',
            'Resell or redistribute the service except as expressly permitted by a Business plan.',
          ]}
        />
      </Section>

      <Section title="4. Storage plans and limits">
        <p>
          Your plan determines the encrypted storage available to your vault. Plan details and current
          limits are shown in Settings. In this demonstration environment, plan changes are applied
          immediately and no payment is collected.
        </p>
        <Bullets
          items={[
            'You may change plans at any time, provided the new plan can hold the files already stored.',
            'Files in Trash continue to count toward your limit until permanently deleted.',
            'We may suspend uploads, but not delete your files, if usage exceeds a plan limit.',
            'We may change plan pricing or inclusions with reasonable advance notice.',
          ]}
        />
      </Section>

      <Section title="5. Encryption and security">
        <p>
          E-Drive is designed around zero-knowledge encryption. Files are encrypted before they leave your
          device, and your master password is never sent to our servers. This means we cannot recover your
          password or decrypt your files if you lose access to both your password and recovery options.
        </p>
        <p>
          You are responsible for maintaining backups of anything you cannot afford to lose. No security
          measure is perfect, and you use the service at your own risk.
        </p>
      </Section>

      <Section title="6. Shared links">
        <p>
          You control the documents you share. Anyone with a valid share link may be able to view or
          download the shared document until the link expires or you revoke it. Do not share links through
          untrusted channels, and review active shares regularly.
        </p>
      </Section>

      <Section title="7. Your content and intellectual property">
        <p>
          You retain ownership of the documents and credentials you store. You grant us the limited licence
          needed to store, transmit and display your content solely to operate the service for you. We do
          not claim ownership of your files and do not use them for advertising.
        </p>
        <p>
          The E-Drive name, interface, logos and underlying software are owned by us or our licensors and
          may not be copied or redistributed without permission.
        </p>
      </Section>

      <Section title="8. Availability and support">
        <p>
          We aim to keep E-Drive available, but the service is provided on an “as available” basis. We may
          perform maintenance, apply security updates, or change features. Planned maintenance will be
          communicated where practical. Support response times depend on your plan.
        </p>
      </Section>

      <Section title="9. Suspension and termination">
        <p>
          You may stop using E-Drive at any time and delete your account from your profile. We may suspend
          or terminate access if you materially breach these terms, create a security risk, or use the
          service unlawfully. Where possible, we will give notice so you can export your data.
        </p>
      </Section>

      <Section title="10. Disclaimers and liability">
        <p>
          To the maximum extent permitted by law, E-Drive is provided without warranties of any kind. We
          are not liable for indirect, incidental or consequential losses, loss of profits, or loss of data
          caused by events outside our reasonable control or by your failure to safeguard your credentials.
          Nothing in these terms limits liability that cannot lawfully be limited.
        </p>
      </Section>

      <Section title="11. Changes to these terms">
        <p>
          We may update these terms to reflect changes in the service or the law. Material changes will be
          announced in the app or by email before they take effect. Continued use after the effective date
          means you accept the updated terms.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          Questions about these terms can be sent to{' '}
          <a href="mailto:legal@e-drive.example" className="font-semibold text-brand-600 hover:text-brand-700">
            legal@e-drive.example
          </a>
          . For security reports, contact{' '}
          <a href="mailto:security@e-drive.example" className="font-semibold text-brand-600 hover:text-brand-700">
            security@e-drive.example
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  )
}

export function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Privacy"
      title="Privacy Policy"
      summary="This policy explains what E-Drive collects, why we collect it, how long we keep it, and the controls you have over your data."
    >
      <Section title="1. Overview">
        <p>
          E-Drive Cloud is an encrypted document vault. We collect the minimum information needed to run
          your account, protect your vault and provide the features you use. Your document contents and
          credential secrets are not readable by us.
        </p>
      </Section>

      <Section title="2. Information we collect">
        <Bullets
          items={[
            'Account details: name, email address, password hash, role and optional profile fields such as phone, job title and company.',
            'Vault metadata: file names, sizes, categories, tags, expiry dates, share settings and storage usage.',
            'Credential metadata: name, type, identifier, URL, health and rotation dates. Secrets are stored encrypted and revealed only through an audited request.',
            'Security data: device name, operating system, browser, approximate location, IP address and sign-in times.',
            'Activity data: document, credential, sharing, security and account events used for your audit log.',
            'Preferences: security controls, notification preferences and privacy choices.',
          ]}
        />
      </Section>

      <Section title="3. How we use information">
        <Bullets
          items={[
            'To authenticate you, unlock your vault and keep your session secure.',
            'To store, organise, preview and share the documents you choose.',
            'To send expiry reminders, security alerts and the notifications you request.',
            'To show storage usage and apply plan limits.',
            'To detect abuse, investigate security incidents and comply with legal obligations.',
            'To improve features using aggregated or anonymised usage, unless you opt out.',
          ]}
        />
      </Section>

      <Section title="4. Legal bases">
        <p>
          Where applicable, we rely on performance of our contract with you to provide the service, our
          legitimate interests in securing and improving E-Drive, your consent for optional communications
          and analytics, and legal obligations where retention is required.
        </p>
      </Section>

      <Section title="5. Sharing and disclosure">
        <p>
          We do not sell your personal information. We share data only with service providers who help us
          operate E-Drive (such as hosting, email delivery and error monitoring), under contracts that
          restrict their use of it, or when required by law or to protect the rights and safety of our
          users. Documents you share are disclosed to anyone with the active share link.
        </p>
      </Section>

      <Section title="6. Retention and deletion">
        <Bullets
          items={[
            'Documents remain in your vault until you delete them. Deleted documents stay in Trash until permanently removed.',
            'Permanently deleted files, credentials and share links are removed from active storage immediately.',
            'Deleting your account removes your documents, credentials, devices, notifications and activity history, except records we must retain by law.',
            'Backups are rotated on a fixed schedule and are not used to restore individual deleted items.',
          ]}
        />
      </Section>

      <Section title="7. Security">
        <p>
          E-Drive uses TLS 1.3 in transit and AES-256 encryption at rest. Access to production systems is
          restricted, logged and reviewed. Passwords are stored as one-way hashes. Credential secrets are
          revealed only through an audited endpoint, and every reveal is recorded in your activity log.
        </p>
        <p>
          No system is completely secure. If you discover a vulnerability, please report it responsibly to{' '}
          <a href="mailto:security@e-drive.example" className="font-semibold text-brand-600 hover:text-brand-700">
            security@e-drive.example
          </a>
          .
        </p>
      </Section>

      <Section title="8. Cookies and local storage">
        <p>
          E-Drive uses a secure session cookie to keep you signed in and basic local storage for interface
          preferences. We do not use advertising cookies. Clearing site data signs you out of the web app,
          and essential security cookies cannot be disabled while you are signed in.
        </p>
      </Section>

      <Section title="9. Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, export, restrict or delete
          your personal information, and to object to certain processing. You can exercise most of these
          directly from your profile and settings:
        </p>
        <Bullets
          items={[
            'Export a JSON copy of your account data from Profile or Settings → Privacy.',
            'Correct your name, email, phone, job title, company and bio from Profile.',
            'Change notification, security and privacy preferences from Settings.',
            'Delete your account permanently from Profile → Data & account.',
          ]}
        />
        <p>
          To make a request you cannot complete in the app, email{' '}
          <a href="mailto:privacy@e-drive.example" className="font-semibold text-brand-600 hover:text-brand-700">
            privacy@e-drive.example
          </a>
          . We will respond within the timeframe required by applicable law.
        </p>
      </Section>

      <Section title="10. Children">
        <p>
          E-Drive is not directed to children under 16. We do not knowingly collect personal information
          from children. If you believe a child has created an account, contact us and we will remove it.
        </p>
      </Section>

      <Section title="11. International transfers">
        <p>
          E-Drive is operated from the United States. If you access the service from another region, your
          information may be transferred to and processed in the United States. We use appropriate
          safeguards for such transfers where required.
        </p>
      </Section>

      <Section title="12. Changes and contact">
        <p>
          We may update this policy as the service evolves. Material changes will be announced in the app
          or by email. For privacy questions, contact{' '}
          <a href="mailto:privacy@e-drive.example" className="font-semibold text-brand-600 hover:text-brand-700">
            privacy@e-drive.example
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  )
}
