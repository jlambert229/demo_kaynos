import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="tos-page">
      <Link to="/" className="tos-back-link">← Back to app</Link>

      <h1>Terms of Service</h1>
      <p className="tos-updated">Last updated: March 29, 2026</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using Kaynos ("the Platform"), you agree to be bound by these Terms of
        Service. If you are accepting on behalf of a school or organization, you represent that you
        have authority to bind that entity.
      </p>

      <h2>2. Account & School Setup</h2>
      <p>
        Each school operates as an independent tenant on the Platform. The school administrator is
        responsible for managing members, content, and billing. You must provide accurate information
        and keep your credentials secure.
      </p>

      <h2>3. Video Storage & Limits</h2>

      <div className="tos-highlight">
        <p>
          <strong>All schools share the same plan limits:</strong> up to 100 videos and 50 GB of
          total storage. These limits apply to session recordings and class recordings combined.
        </p>
      </div>

      <h3>3.1 Upload Limits</h3>
      <ul>
        <li>Maximum of <strong>100 videos</strong> per school (sessions and classes combined)</li>
        <li>Maximum total storage of <strong>50 GB</strong> per school</li>
        <li>Individual file size limit of <strong>5 GB</strong> per upload</li>
        <li>Supported formats: MP4, MOV, WebM, MKV</li>
      </ul>
      <p>
        When a school reaches its video or storage limit, new uploads will be blocked until existing
        videos are removed. The Platform will display usage information so administrators can manage
        their content proactively.
      </p>

      <h3>3.2 Video Lifecycle & Retention</h3>
      <p>
        Videos uploaded to the Platform follow this lifecycle:
      </p>
      <ul>
        <li>
          <strong>Active:</strong> Videos are available for playback as long as the school account is
          active and in good standing. There is no automatic expiration on active accounts.
        </li>
        <li>
          <strong>Trial expiration:</strong> If a school's free trial expires without subscribing,
          video content is preserved for <strong>30 days</strong> after the trial ends. During this
          grace period, videos remain accessible in read-only mode (no new uploads). After 30 days,
          video files are permanently deleted.
        </li>
        <li>
          <strong>Account cancellation:</strong> If a school cancels its account, video content is
          preserved for <strong>30 days</strong> after cancellation. School administrators should
          export any needed content before this period ends.
        </li>
        <li>
          <strong>Deletion:</strong> When a session or class is deleted by an instructor or
          administrator, the associated video file is permanently removed from storage. This action
          cannot be undone.
        </li>
      </ul>

      <div className="tos-highlight">
        <p>
          <strong>Important:</strong> Kaynos is not an archival storage service. We recommend that
          schools maintain their own backups of critical recordings. Use the session export feature
          to save session data, and download video files separately as needed.
        </p>
      </div>

      <h3>3.3 Storage & Playback</h3>
      <p>
        Videos are stored securely using encrypted object storage. Playback URLs are generated
        on-demand and expire after 4 hours. Videos are only accessible to authenticated members of
        the school that owns them. Session videos are further restricted to the assigned student and
        the school's instructors/administrators.
      </p>

      <h2>4. Data Ownership</h2>
      <p>
        Schools and their users retain full ownership of all content uploaded to the Platform,
        including video recordings, session notes, class materials, and student data. Kaynos does
        not claim any ownership rights to your content.
      </p>
      <p>
        By uploading content, you grant Kaynos a limited license to store, process, and deliver that
        content solely for the purpose of providing the Platform's services (video hosting, playback,
        and note synchronization).
      </p>

      <h2>5. Data Export</h2>
      <p>
        The Platform provides tools to export your data:
      </p>
      <ul>
        <li>
          <strong>Session export:</strong> Individual sessions can be exported as text files
          containing the session title, date, student and instructor names, all timestamped notes,
          and tags.
        </li>
        <li>
          <strong>List export:</strong> Session and class lists can be exported as CSV files from
          their respective list pages.
        </li>
        <li>
          <strong>Roster export:</strong> School administrators can export the member roster as CSV.
        </li>
      </ul>

      <h2>6. Acceptable Use</h2>
      <p>
        You may not use the Platform to store or distribute content that is illegal, infringes on
        intellectual property rights, or violates the privacy of others. Kaynos reserves the right
        to remove content that violates these terms and to suspend or terminate accounts engaged in
        abuse.
      </p>

      <h2>7. Service Availability</h2>
      <p>
        Kaynos aims to provide reliable service but does not guarantee 100% uptime. We may perform
        maintenance that temporarily affects availability. We will make reasonable efforts to notify
        users of planned downtime.
      </p>

      <h2>8. Changes to Terms</h2>
      <p>
        We may update these Terms of Service from time to time. Material changes will be communicated
        to school administrators via email. Continued use of the Platform after changes take effect
        constitutes acceptance of the revised terms.
      </p>

      <h2>9. Contact</h2>
      <p>
        For questions about these terms or your account, contact us at{" "}
        <a href="mailto:support@kaynos.app">support@kaynos.app</a>.
      </p>
    </div>
  );
}
