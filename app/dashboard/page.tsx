import Link from 'next/link';

export default function DashboardPage() {
  return (
    <>
      <header className="site-header client-portfolio-header" id="top">
        <nav aria-label="Client portal navigation" className="nav container">
          <button
            className="portal-panel-toggle header-panel-toggle"
            id="portalPanelToggle"
            type="button"
            aria-label="Open Client Portfolio menu"
            aria-controls="portalPanelMenu"
            aria-expanded="false"
          >
            <span className="portal-panel-toggle-icon" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span className="portal-panel-toggle-label">Portal Menu</span>
          </button>

          <Link aria-label="CPSM home" className="brand brand-image-only" href="/dashboard">
            <img src="/assets/momentum-data-logo-transparent.svg" alt="CPSM logo" className="brand-logo brand-logo-transparent" />
          </Link>

          <button aria-expanded="false" aria-label="Open menu" className="nav-toggle">
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className="nav-links">
            <Link href="/dashboard">Home</Link>
            <Link href="/documents">Services</Link>
            <Link href="/onboarding">What We Do</Link>
            <Link href="/agreements">About Us</Link>
            <Link href="/settings">Settings</Link>
            <Link className="mobile-contact" href="/documents">Contact us</Link>
            <Link className="mobile-client-login" href="/login">Client Log-in</Link>
          </div>

          <div className="nav-actions nav-contact">
            <Link className="nav-cta" href="/documents">Contact us</Link>
            <Link className="nav-cta" href="/settings">Settings</Link>
            <Link className="nav-client-login" href="/login">Client Log-in</Link>
          </div>
        </nav>
      </header>

      <main className="client-portal-main clean-card-portal">
        <section className="client-portal-dashboard" aria-labelledby="clientWelcome">
          <div className="container">
            <div className="portal-heading-bar">
              <div className="portal-welcome-stack">
                <h1 id="clientWelcome">
                  <span>Hi, Client,</span>
                  <span>Welcome to Client Portfolio Service Manager.</span>
                </h1>
                <p className="portal-edit-mode-note">Internal edit mode Team controls are hidden from the standard client view.</p>
                <div className="portal-view-chip-row" aria-label="Dashboard view details">
                  <span className="portal-mode-chip">View: Kanban</span>
                  <span className="portal-mode-chip">Client ID 100100</span>
                </div>
              </div>

              <form className="portal-google-search" action="https://www.google.com/search" method="get" target="_blank" role="search">
                <label className="sr-only" htmlFor="portalGoogleSearch">Search with Google</label>
                <input id="portalGoogleSearch" name="q" type="search" placeholder="Search Google from your Client Portfolio" />
                <button className="btn primary" type="submit">Search</button>
                <span>Powered by Google</span>
              </form>
            </div>

            <div className="portal-workspace">
              <div className="portal-main-content">
                <div className="portal-card-grid" aria-label="Client project dashboard tiles">
                  <section className="portal-tile portal-tile-large status-delivery-card">
                    <div className="tile-heading-row">
                      <div>
                        <h2>Current status update</h2>
                        <p className="status-summary">Project is on track.</p>
                      </div>
                      <span className="status-pill">On track</span>
                    </div>
                    <p id="portalProjectDetails">Data mapping is underway. The next client review is scheduled after validation notes are prepared.</p>
                    <div className="status-delivery-row">
                      <div>
                        <h3>Next delivery</h3>
                        <strong id="portalDueDate">To be confirmed</strong>
                      </div>
                      <p>Your deliverable due date will appear here once the project schedule is finalized.</p>
                    </div>
                  </section>

                  <section className="portal-tile deliverables-card">
                    <h2>Deliverables</h2>
                    <div className="clean-list">
                      <div><strong>Project brief</strong><span>Approved</span></div>
                      <div><strong>Data mapping workbook</strong><span>In progress</span></div>
                      <div><strong>Validation summary</strong><span>Due next</span></div>
                    </div>
                  </section>

                  <section className="portal-tile actions-card">
                    <h2>Next actions</h2>
                    <ul className="clean-action-list">
                      <li>Review sample column labels</li>
                      <li>Confirm preferred delivery format</li>
                      <li>Send any additional source files</li>
                    </ul>
                  </section>

                  <section className="portal-tile portal-tile-wide workflows-progress-card" aria-labelledby="workflowsInProgressTitle">
                    <div className="tile-heading-row">
                      <div>
                        <p className="tile-kicker">Workflow Center</p>
                        <h2 id="workflowsInProgressTitle">Workflows In Progress</h2>
                        <p>Active CPSM workflows organized by trigger.</p>
                      </div>
                      <span className="status-pill">5 Active</span>
                    </div>

                    <div className="workflow-trigger-list">
                      {[
                        ['New Client Created', 'Client Onboarding Workflow'],
                        ['Document Uploaded', 'Document Review Workflow'],
                        ['Service Assigned', 'Service Engagement Workflow'],
                        ['Document Expiration Approaching', 'Expiration Follow-Up Workflow'],
                        ['Client Submission Received', 'Client Approval Workflow'],
                      ].map(([trigger, workflow]) => (
                        <section className="workflow-trigger-group" key={trigger}>
                          <div className="workflow-trigger-heading">
                            <span>Trigger</span>
                            <h3>{trigger}</h3>
                          </div>
                          <div className="workflow-row">
                            <strong>{workflow}</strong>
                            <span>In progress</span>
                          </div>
                        </section>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              <aside className="portal-side-panel" aria-label="Client Portfolio side panel">
                <section className="side-panel-card tools-card">
                  <h2>Workspace</h2>
                  <div className="tool-link-list">
                    <Link href="/settings"><strong>Settings</strong><span>Configure CPSM</span></Link>
                    <Link href="/documents"><strong>Documents</strong><span>Open library</span></Link>
                    <Link href="/agreements"><strong>Agreements</strong><span>Native signing</span></Link>
                  </div>
                </section>

                <section className="side-panel-card authorized-card">
                  <h2>Authorized representatives</h2>
                  <div className="representative-list">
                    <div className="representative-row"><strong>Authorized Representative 1</strong><span>Job Title</span></div>
                    <div className="representative-row"><strong>Authorized Representative 2</strong><span>Job Title</span></div>
                  </div>
                </section>

                <section className="side-panel-card invoices-card">
                  <h2>Invoices</h2>
                  <div className="invoice-list">
                    <div><strong>Invoice #001</strong><span>Pending</span></div>
                    <div><strong>Invoice #002</strong><span>Not issued</span></div>
                  </div>
                </section>

                <section className="side-panel-card portal-contact-tile">
                  <h2>Account access</h2>
                  <p>Replies within one business day.</p>
                  <Link className="btn secondary full" href="/login">Log out</Link>
                </section>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
