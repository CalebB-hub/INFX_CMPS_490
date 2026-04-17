import TopNav from "../components/TopNav";

const emails = [
  {
    id: 1,
    from: "IT Support <it-support@phishfree.local>",
    subject: "Password reset maintenance tonight",
    preview: "The system will briefly be unavailable from 11:00 PM to 11:30 PM while scheduled updates are applied.",
    time: "8:12 AM",
  },
  {
    id: 2,
    from: "Payroll Team <payroll-update@secure-payroll-alerts.net>",
    subject: "Action required: direct deposit issue",
    preview: "Your payment profile has been suspended. Verify your banking details immediately to avoid a delay.",
    time: "8:26 AM",
  },
  {
    id: 3,
    from: "HR Department <hr@phishfree.local>",
    subject: "Benefits enrollment reminder",
    preview: "Open enrollment closes Friday. Review your selections in the employee portal before 5:00 PM.",
    time: "8:41 AM",
  },
  {
    id: 4,
    from: "Microsoft 365 Security <security-team@micr0soft-mail.com>",
    subject: "Unusual sign-in attempt detected",
    preview: "We noticed suspicious activity on your account. Confirm your identity with the secure link below.",
    time: "9:03 AM",
  },
  {
    id: 5,
    from: "Facilities <facilities@phishfree.local>",
    subject: "Parking lot resurfacing notice",
    preview: "The east lot will be closed on Tuesday. Please use the south entrance parking area instead.",
    time: "9:17 AM",
  },
  {
    id: 6,
    from: "DocuShare <documents@docusign-review.co>",
    subject: "Shared document awaiting signature",
    preview: "A confidential invoice is pending. Open the attachment and sign within 30 minutes to prevent cancellation.",
    time: "9:44 AM",
  },
  {
    id: 7,
    from: "Team Lead <manager@phishfree.local>",
    subject: "Project check-in moved to 2:30 PM",
    preview: "Please review the sprint notes before the meeting. We will use the same conference room as last week.",
    time: "10:02 AM",
  },
  {
    id: 8,
    from: "Amazon Business <orders@amazon-business-secure-mail.org>",
    subject: "Order receipt for approved office purchase",
    preview: "We charged your company card for a gift card bundle. If you do not recognize this purchase, click cancel now.",
    time: "10:19 AM",
  },
  {
    id: 9,
    from: "Security Awareness <training@phishfree.local>",
    subject: "April phishing simulation results available",
    preview: "Your latest awareness training summary is now posted in the learning portal.",
    time: "10:37 AM",
  },
  {
    id: 10,
    from: "Travel Desk <traveldesk@company-reimbursements.com>",
    subject: "Expense reimbursement failed",
    preview: "Your reimbursement could not be processed. Re-enter your corporate login and payment details to continue.",
    time: "11:05 AM",
  },
];

export default function Inbox() {
  return (
    <div>
      <TopNav />
      <main className="page inbox-page">
        <section className="inbox-hero">
          <div>
            <h1>Inbox</h1>
            <p className="muted inbox-subtitle">
              Click on an email, read through it, and figure out whether it is phishing or phish free.
            </p>
          </div>
        </section>

        <section className="card inbox-card">
          <div className="inbox-toolbar">
            <div>
              <h2>Primary Mailbox</h2>
            </div>
            <span className="inbox-count">{emails.length} messages</span>
          </div>

          <div className="inbox-list" role="list" aria-label="Inbox email list">
            {emails.map((email) => (
              <article
                key={email.id}
                className="inbox-message"
                role="listitem"
              >
                <div className="inbox-message__main">
                  <p className="inbox-message__from">{email.from}</p>
                  <h3>{email.subject}</h3>
                  <p className="muted">{email.preview}</p>
                </div>
                <div className="inbox-message__meta">
                  <time className="inbox-message__time">{email.time}</time>
                  <span className="inbox-message__arrow" aria-hidden="true">
                    →
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
