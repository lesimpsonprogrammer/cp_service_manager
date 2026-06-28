'use client';

import { useMemo, useState } from 'react';

type View = 'login' | 'signing' | 'status' | 'dashboard';

type AgreementPacket = {
  packetId: string;
  packetName: string;
  status: 'Sent' | 'Viewed' | 'Completed';
  signerName: string;
  signerEmail: string;
  signedPdfStatus: 'Not Available' | 'Stored';
  auditTrailStatus: 'Pending' | 'Captured';
  documentHash?: string;
  events: {
    label: string;
    timestamp: string;
    actor: string;
    detail: string;
  }[];
};

type ClientAccount = {
  email: string;
  displayName: string;
  companyName: string;
  accessStatus: 'pending_signature' | 'active';
  servicePackage: string;
  preOnboardingStatus: string;
  onboardingStatus: string;
  agreementPacket: AgreementPacket;
};

const nowIso = () => new Date().toISOString();

const pendingPacket: AgreementPacket = {
  packetId: 'CPSM-PKT-0001',
  packetName: 'CPSM Client Start Agreement Packet',
  status: 'Sent',
  signerName: 'Pending Client User',
  signerEmail: 'pending@example.com',
  signedPdfStatus: 'Not Available',
  auditTrailStatus: 'Pending',
  events: [
    {
      label: 'Packet created',
      timestamp: '2026-06-28T08:00:00.000Z',
      actor: 'CPSM Admin',
      detail: 'Agreement packet created from approved CPSM templates.',
    },
    {
      label: 'Packet emailed',
      timestamp: '2026-06-28T08:15:00.000Z',
      actor: 'CPSM System',
      detail: 'Secure signing link sent to pending@example.com.',
    },
  ],
};

const completedPacket: AgreementPacket = {
  ...pendingPacket,
  packetId: 'CPSM-PKT-0002',
  status: 'Completed',
  signerName: 'Client User',
  signerEmail: 'client@example.com',
  signedPdfStatus: 'Stored',
  auditTrailStatus: 'Captured',
  documentHash: 'sha256:8b7f0f2a-demo-native-cpsm-signature-record',
  events: [
    ...pendingPacket.events,
    {
      label: 'Packet viewed',
      timestamp: '2026-06-28T09:12:00.000Z',
      actor: 'Client User',
      detail: 'Signer opened the CPSM native signing room.',
    },
    {
      label: 'Electronic consent accepted',
      timestamp: '2026-06-28T09:20:00.000Z',
      actor: 'Client User',
      detail: 'Signer agreed to use electronic records and electronic signatures.',
    },
    {
      label: 'Packet signed',
      timestamp: '2026-06-28T09:30:00.000Z',
      actor: 'Client User',
      detail: 'Signer typed legal name and submitted the agreement packet.',
    },
    {
      label: 'Signed PDF stored',
      timestamp: '2026-06-28T09:31:00.000Z',
      actor: 'CPSM System',
      detail: 'Final PDF, audit trail, timestamp, and document hash were stored.',
    },
  ],
};

const demoAccounts: Record<string, ClientAccount> = {
  'pending@example.com': {
    email: 'pending@example.com',
    displayName: 'Pending Client User',
    companyName: 'Pending Client Group',
    accessStatus: 'pending_signature',
    servicePackage: 'Client Portfolio Management',
    preOnboardingStatus: 'In Progress',
    onboardingStatus: 'Limited Start',
    agreementPacket: pendingPacket,
  },
  'client@example.com': {
    email: 'client@example.com',
    displayName: 'Client User',
    companyName: 'CPSM Client Account',
    accessStatus: 'active',
    servicePackage: 'Client Portfolio Management',
    preOnboardingStatus: 'Active',
    onboardingStatus: 'Active',
    agreementPacket: completedPacket,
  },
};

export default function LoginPage() {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('pending@example.com');
  const [password, setPassword] = useState('');
  const [account, setAccount] = useState<ClientAccount | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [signatureText, setSignatureText] = useState('');

  const hasAccess = account?.accessStatus === 'active';
  const canLogin = email.trim().length > 5 && password.trim().length > 0;

  const canSign = useMemo(() => {
    if (!account) return false;

    return (
      consentChecked &&
      signatureText.trim().toLowerCase() === account.displayName.trim().toLowerCase()
    );
  }, [account, consentChecked, signatureText]);

  function handleLogin() {
    if (!canLogin) return;

    const normalizedEmail = email.trim().toLowerCase();

    const matchedAccount =
      demoAccounts[normalizedEmail] ??
      ({
        email: normalizedEmail,
        displayName: 'Client User',
        companyName: 'Client Account',
        accessStatus: 'pending_signature',
        servicePackage: 'Client Portfolio Management',
        preOnboardingStatus: 'In Progress',
        onboardingStatus: 'Limited Start',
        agreementPacket: {
          ...pendingPacket,
          packetId: `CPSM-PKT-${Date.now()}`,
          signerName: 'Client User',
          signerEmail: normalizedEmail,
        },
      } satisfies ClientAccount);

    const viewedPacket: AgreementPacket =
      matchedAccount.agreementPacket.status === 'Sent'
        ? {
            ...matchedAccount.agreementPacket,
            status: 'Viewed',
            events: [
              ...matchedAccount.agreementPacket.events,
              {
                label: 'Packet viewed',
                timestamp: nowIso(),
                actor: matchedAccount.displayName,
                detail: 'Signer opened the CPSM native signing room.',
              },
            ],
          }
        : matchedAccount.agreementPacket;

    const hydratedAccount: ClientAccount = {
      ...matchedAccount,
      agreementPacket: viewedPacket,
    };

    setAccount(hydratedAccount);
    setConsentChecked(false);
    setSignatureText('');
    setView(hydratedAccount.accessStatus === 'active' ? 'dashboard' : 'signing');
  }

  function handleSignPacket() {
    if (!account || !canSign) return;

    const signedAt = nowIso();

    const signedAccount: ClientAccount = {
      ...account,
      accessStatus: 'active',
      preOnboardingStatus: 'Active',
      onboardingStatus: 'Active',
      agreementPacket: {
        ...account.agreementPacket,
        status: 'Completed',
        signedPdfStatus: 'Stored',
        auditTrailStatus: 'Captured',
        documentHash: `sha256:${Math.random().toString(16).slice(2)}-${Date.now()}`,
        events: [
          ...account.agreementPacket.events,
          {
            label: 'Electronic consent accepted',
            timestamp: signedAt,
            actor: account.displayName,
            detail: 'Signer agreed to use electronic records and electronic signatures.',
          },
          {
            label: 'Packet signed',
            timestamp: signedAt,
            actor: account.displayName,
            detail: 'Signer typed legal name and submitted the CPSM agreement packet.',
          },
          {
            label: 'Signed PDF stored',
            timestamp: signedAt,
            actor: 'CPSM System',
            detail: 'Final PDF, audit trail, timestamp, signer details, and document hash were stored.',
          },
        ],
      },
    };

    setAccount(signedAccount);
    setView('dashboard');
  }

  function navTo(nextView: View) {
    if (nextView === 'dashboard' && !hasAccess) {
      setView('status');
      return;
    }

    if ((nextView === 'signing' || nextView === 'status') && !account) {
      return;
    }

    setView(nextView);
  }

  return (
    <main className="cpsm-page">
      <nav className="cpsm-app-nav">
        <div className="cpsm-nav-inner">
          <button className="cpsm-brand-button" onClick={() => navTo(hasAccess ? 'dashboard' : 'login')}>
            <span className="cpsm-brand-mark">CP</span>
            <span>
              <strong className="cpsm-brand-title">CPSM</strong>
              <small className="cpsm-brand-subtitle">Client Portfolio SM</small>
            </span>
          </button>

          <div className="cpsm-nav-links">
            <button className={navClass(view === 'login')} onClick={() => navTo('login')}>
              Sign In
            </button>
            <button
              className={navClass(view === 'signing', !account || hasAccess)}
              onClick={() => navTo('signing')}
              disabled={!account || hasAccess}
            >
              Native Signing
            </button>
            <button
              className={navClass(view === 'status', !account)}
              onClick={() => navTo('status')}
              disabled={!account}
            >
              Status
            </button>
            <button
              className={navClass(view === 'dashboard', !hasAccess)}
              onClick={() => navTo('dashboard')}
              disabled={!hasAccess}
            >
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      <section className="cpsm-shell">
        {view === 'login' && (
          <section className="cpsm-login-layout">
            <div className="cpsm-panel">
              <p className="cpsm-eyebrow">Client Portfolio SM</p>
              <h1 className="cpsm-title">Native CPSM signing, built into the portal.</h1>
              <p className="cpsm-subtitle">
                CPSM can send, sign, store, and audit agreement packets without depending on an outside
                e-signature vendor for the first product version.
              </p>

              <div className="cpsm-grid">
                <PreviewTile
                  title="Native E-Sign"
                  value="Built In"
                  helper="Typed signature, consent, timestamp, signer identity, and packet status."
                />
                <PreviewTile
                  title="PDF Storage"
                  value="CPSM"
                  helper="Final signed PDF and audit trail can be stored in the CPSM document library."
                />
                <PreviewTile
                  title="Audit Trail"
                  value="Captured"
                  helper="Every key event is recorded for evidence and internal review."
                />
                <PreviewTile
                  title="Access Control"
                  value="Automatic"
                  helper="Dashboard access activates after the packet is completed."
                />
              </div>

              <div className="cpsm-flow-card">
                <div className="cpsm-flow-header">
                  <span className="cpsm-status-dot" />
                  <strong>CPSM Native Agreement Flow</strong>
                </div>
                <FlowLine left="1. Create agreement packet from CPSM templates" right="Draft" />
                <FlowLine left="2. Email secure signing link to client" right="Sent" />
                <FlowLine left="3. Client consents and signs in CPSM" right="Signed" />
                <FlowLine left="4. Store signed PDF, hash, and audit trail" right="Stored" />
                <FlowLine left="5. Unlock portal dashboard access" right="Active" />
              </div>
            </div>

            <section className="cpsm-card cpsm-auth-card">
              <div className="cpsm-card-header">
                <span className="cpsm-brand-mark-large">CP</span>
                <div>
                  <p className="cpsm-eyebrow">Secure Access</p>
                  <h2 className="cpsm-section-title">Sign in</h2>
                </div>
              </div>

              <p className="cpsm-text">
                Use your CPSM account credentials. If your agreement packet is pending, CPSM will route
                you to the native signing room before dashboard access opens.
              </p>

              <label className="cpsm-label">
                Email Address
                <input
                  className="cpsm-input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label className="cpsm-label">
                Password
                <input
                  className="cpsm-input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                />
              </label>

              <button className="cpsm-primary-button" disabled={!canLogin} onClick={handleLogin}>
                Sign in to CPSM
              </button>

              <div className="cpsm-auth-footer">
                <span className="cpsm-link">Forgot password?</span>
                <span>Authorized access only.</span>
              </div>

              <p className="cpsm-small-text">
                Demo: <strong>pending@example.com</strong> tests signing.{' '}
                <strong>client@example.com</strong> opens completed access. Any password works.
              </p>
            </section>
          </section>
        )}

        {view === 'signing' && account && (
          <section className="cpsm-card">
            <div className="cpsm-notice">
              <strong>Native CPSM signing required</strong>
              <span>Review the packet, consent to electronic signing, and type your full name to complete access.</span>
            </div>

            <h2 className="cpsm-section-title">CPSM Native Signing Room</h2>
            <p className="cpsm-text">
              This prototype shows how CPSM can manage e-signature in-house: consent, signer confirmation,
              typed signature, timestamp, audit trail, final PDF status, and access activation.
            </p>

            <AgreementPacketPanel packet={account.agreementPacket} />

            <section className="cpsm-card">
              <p className="cpsm-eyebrow">Agreement Preview</p>
              <h3 className="cpsm-subheading">CPSM Client Start Agreement Packet</h3>
              <p className="cpsm-text">
                This packet includes the Confidentiality Agreement and Client Engagement Agreement.
                In production, this area will render the actual agreement template with required fields,
                initials, signature anchors, and final PDF generation.
              </p>

              <label className="cpsm-label">
                <span>
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(event) => setConsentChecked(event.target.checked)}
                  />{' '}
                  I agree to use electronic records and electronic signatures for this CPSM agreement packet.
                </span>
              </label>

              <label className="cpsm-label">
                Type your full name to sign
                <input
                  className="cpsm-input"
                  value={signatureText}
                  onChange={(event) => setSignatureText(event.target.value)}
                  placeholder={account.displayName}
                />
              </label>

              <p className="cpsm-small-text">
                Required signature text must match: <strong>{account.displayName}</strong>
              </p>

              <button className="cpsm-primary-button" disabled={!canSign} onClick={handleSignPacket}>
                Sign Packet & Activate CPSM Access
              </button>
            </section>
          </section>
        )}

        {view === 'status' && (
          <section className="cpsm-card">
            <div className={hasAccess ? 'cpsm-success' : 'cpsm-notice'}>
              <strong>{hasAccess ? 'Access Active' : 'Access Pending'}</strong>
              <span>
                {hasAccess
                  ? 'The native agreement packet is completed, signed PDF status is stored, and dashboard access is active.'
                  : 'Dashboard access is pending until the client completes the native CPSM agreement packet.'}
              </span>
            </div>

            <h2 className="cpsm-section-title">Native agreement status</h2>

            {account ? (
              <>
                <AgreementPacketPanel packet={account.agreementPacket} />
                <div className="cpsm-dashboard-grid">
                  <DashboardTile title="Client Account" value={account.companyName} />
                  <DashboardTile title="Service Package" value={account.servicePackage} />
                  <DashboardTile title="Pre-Onboarding" value={account.preOnboardingStatus} />
                  <DashboardTile title="Onboarding" value={account.onboardingStatus} />
                </div>
              </>
            ) : (
              <p className="cpsm-text">Sign in first to view agreement status.</p>
            )}
          </section>
        )}

        {view === 'dashboard' && account && (
          <section className="cpsm-card">
            <div className="cpsm-success">
              <strong>CPSM Access Granted</strong>
              <span>Native signature completed, signed agreement record stored, and audit trail captured.</span>
            </div>

            <h2 className="cpsm-section-title">Welcome to your CPSM workspace</h2>
            <p className="cpsm-text">
              This is the post-signature state. The client has completed the CPSM-native agreement process,
              and full workspace access is now active.
            </p>

            <div className="cpsm-dashboard-grid">
              <DashboardTile title="Client Account" value={account.companyName} />
              <DashboardTile title="Agreement Packet" value={account.agreementPacket.status} />
              <DashboardTile title="Signed PDF" value={account.agreementPacket.signedPdfStatus} />
              <DashboardTile title="Audit Trail" value={account.agreementPacket.auditTrailStatus} />
            </div>

            <AgreementPacketPanel packet={account.agreementPacket} />
          </section>
        )}
      </section>
    </main>
  );
}

function navClass(active: boolean, disabled = false) {
  return [
    'cpsm-nav-link',
    active ? 'cpsm-nav-link-active' : '',
    disabled ? 'cpsm-nav-link-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function PreviewTile({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="cpsm-tile">
      <p className="cpsm-tile-title">{title}</p>
      <p className="cpsm-tile-value">{value}</p>
      <p className="cpsm-tile-helper">{helper}</p>
    </div>
  );
}

function FlowLine({ left, right }: { left: string; right: string }) {
  return (
    <div className="cpsm-flow-line">
      <span>{left}</span>
      <strong>{right}</strong>
    </div>
  );
}

function DashboardTile({ title, value }: { title: string; value: string }) {
  return (
    <div className="cpsm-tile">
      <p className="cpsm-tile-title">{title}</p>
      <p className="cpsm-tile-helper">{value}</p>
    </div>
  );
}

function AgreementPacketPanel({ packet }: { packet: AgreementPacket }) {
  return (
    <section className="cpsm-card">
      <div className="cpsm-card-header">
        <div>
          <p className="cpsm-eyebrow">CPSM Native E-Sign</p>
          <h3 className="cpsm-subheading">{packet.packetName}</h3>
        </div>
      </div>

      <div className="cpsm-dashboard-grid">
        <DashboardTile title="Packet ID" value={packet.packetId} />
        <DashboardTile title="Status" value={packet.status} />
        <DashboardTile title="Signer" value={`${packet.signerName} • ${packet.signerEmail}`} />
        <DashboardTile title="Signed PDF" value={packet.signedPdfStatus} />
        <DashboardTile title="Audit Trail" value={packet.auditTrailStatus} />
        <DashboardTile title="Document Hash" value={packet.documentHash ?? 'Pending'} />
      </div>

      <h4 className="cpsm-subheading">Audit activity</h4>
      <div>
        {packet.events.map((event) => (
          <div key={`${event.label}-${event.timestamp}`} className="cpsm-text">
            <strong>{event.label}</strong>
            <br />
            {new Date(event.timestamp).toLocaleString()} • {event.actor}
            <br />
            {event.detail}
          </div>
        ))}
      </div>
    </section>
  );
}
