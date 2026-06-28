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
