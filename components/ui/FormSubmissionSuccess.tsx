'use client';

interface Props {
  name:      string;
  email:     string;
  mailtoUrl: string;
  onReset?:  () => void;   // lets parent (or the form itself) re-open the form
}

export default function FormSubmissionSuccess({ name, email, mailtoUrl, onReset }: Props) {
  return (
    <div className="form-success">
      {/* Animated check icon */}
      <div className="success-icon">
        <svg viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <div className="success-t">Transmission Received</div>

      <div className="success-d">
        Contract logged for <strong style={{ color: '#8EECFF' }}>{name}</strong>.
        The hunter will respond to <strong style={{ color: '#8EECFF' }}>{email}</strong> within 24 hours.
      </div>

      {/* Primary action — open in email client */}
      <a className="ct-btn primary" href={mailtoUrl} target="_blank" rel="noopener noreferrer">
        Open in Mail Client
      </a>

      {/* Secondary — send another */}
      {onReset && (
        <button
          type="button"
          className="ct-btn"
          style={{ marginTop: 10, width: '100%' }}
          onClick={onReset}
        >
          Send Another
        </button>
      )}
    </div>
  );
}
