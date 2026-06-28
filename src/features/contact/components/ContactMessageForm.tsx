'use client';
import Input from '@/components/ui/Input';
import FormSubmissionSuccess from './FormSubmissionSuccess';
import { useContactForm } from '@/features/contact/hooks/useContactForm';

const CONTRACT_TYPES = ['Full-time role', 'Contract / Freelance', 'Collaboration', 'Other'];

interface Props {
  onSuccess?: (mailtoUrl: string, name: string, email: string) => void;
}

export default function ContactMessageForm({ onSuccess }: Props) {
  const {
    fields, errors, submitting, submitError, submitted, successData,
    handleChange, handleBlur, handleSubmit, handleReset,
  } = useContactForm({ onSuccess });
  if (submitted) {
    return (
      <FormSubmissionSuccess
        name={successData.name}
        email={successData.email}
        mailtoUrl={successData.mailto}
        onReset={handleReset}
      />
    );
  }
  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Honeypot: hidden from humans (off-screen), bait for bots. A real
          visitor never sees or fills this; if it arrives non-empty the server
          fakes success and silently drops the submission. Not a DB field.
          The input is named with a neutral token (NOT "company"/"organization")
          so browser autofill / password managers won't fill it for real users. */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
      >
        <input
          type="text"
          id="contact_reference"
          name="contact_reference"
          tabIndex={-1}
          autoComplete="off"
          value={fields.company}
          onChange={(e) => handleChange('company')(e.target.value)}
        />
      </div>

      <Input
        label="Name"
        placeholder="Enter your name"
        value={fields.name}
        onChange={handleChange('name')}
        onBlur={handleBlur('name')}
        error={errors.name || undefined}
      />

      <Input
        label="Client Designation"
        placeholder="Represented Organization (if applicable)"
        value={fields.org}
        onChange={handleChange('org')}
        onBlur={handleBlur('org')}
        error={errors.org || undefined}
      />

      <Input
        type="email"
        label="Comm Channel"
        placeholder="you@channel.com"
        value={fields.email}
        onChange={handleChange('email')}
        onBlur={handleBlur('email')}
        error={errors.email || undefined}
      />

      <Input
        type="select"
        label="Contract Type"
        options={CONTRACT_TYPES}
        value={fields.contractType}
        onChange={handleChange('contractType')}
      />

      <Input
        type="textarea"
        label="Mission Brief"
        placeholder="Describe the bounty..."
        rows={4}
        value={fields.message}
        onChange={handleChange('message')}
        onBlur={handleBlur('message')}
        error={errors.message || undefined}
      />
      {submitError && (
        <p className="mb-3 font-gx-mono text-[11px] tracking-wider text-error">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        className="ct-btn primary form-submit w-full mt-2"
        disabled={submitting}
      >
        {submitting ? 'Transmitting...' : 'Transmit Contract →'}
      </button>
    </form>
  );
}
