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
        <p className="mb-3 font-gx-mono text-[11px] tracking-[0.05em] text-error">
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
