import { useState, useRef, useCallback } from 'react';
import { validateField, type ContactFormField } from '@/features/contact/validation';

// ── Types ──────────────────────────────────────────────────────────────────────

export type Fields = { name: string; email: string; contractType: string; message: string; org: string; company: string };
export type Errors = { name: string; email: string; contractType: string; message: string; org: string; company: string }

interface Options {
  onSuccess?: (mailtoUrl: string, name: string, email: string) => void;
}

export interface UseContactFormReturn {
  fields:      Fields;
  errors:      Errors;
  submitting:  boolean;
  submitError: string;
  submitted:   boolean;
  successData: { mailto: string; name: string; email: string };
  handleChange: (field: keyof Fields) => (value: string) => void;
  handleBlur:   (field: ContactFormField) => () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleReset:  () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_FIELDS: Fields = { name: '', email: '', contractType: 'Other', message: '', org: '', company: '' };
const EMPTY_ERRORS: Errors = { name: '', email: '', contractType: '', message: '', org: '', company: '' };

function validateAll(fields: Fields): Errors {
  return {
    name:    validateField('name',    fields.name),
    org:     validateField('org',     fields.org),
    email:   validateField('email',   fields.email),
    message: validateField('message', fields.message),
    company: validateField('company', fields.company),
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useContactForm({ onSuccess }: Options = {}): UseContactFormReturn {
  const [fields,      setFields]      = useState<Fields>(EMPTY_FIELDS);
  const [touched,     setTouched]     = useState<Partial<Record<ContactFormField, boolean>>>({});
  const [errors,      setErrors]      = useState<Errors>(EMPTY_ERRORS);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted,   setSubmitted]   = useState(false);
  const [successData, setSuccessData] = useState({ mailto: '', name: '', email: '' });

  const requestId = useRef<string>(crypto.randomUUID());

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleChange(field: keyof Fields) {
    return (value: string) => {
      setFields(prev => ({ ...prev, [field]: value }));
      if (touched[field as ContactFormField]) {
        setErrors(prev => ({ ...prev, [field]: validateField(field as ContactFormField, value) }));
      }
    };
  }

  function handleBlur(field: ContactFormField) {
    return () => {
      setTouched(prev => ({ ...prev, [field]: true }));
      setErrors(prev => ({ ...prev, [field]: validateField(field, fields[field]) }));
    };
  }

  // useCallback: state setters and refs are stable — no deps needed
  const handleReset = useCallback(() => {
    setFields(EMPTY_FIELDS);
    setErrors(EMPTY_ERRORS);
    setTouched({});
    setSubmitError('');
    setSubmitted(false);
    requestId.current = crypto.randomUUID();
  }, []);

  // useCallback: re-created only when fields or onSuccess changes
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    setTouched({ name: true, email: true, message: true, org: true });
    const next = validateAll(fields);
    setErrors(next);
    if (next.name || next.email || next.message || next.org) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/contact', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId.current,
        },
        body: JSON.stringify({
          name:    fields.name,
          email:   fields.email,
          type:    fields.contractType,
          message: fields.message,
          org:     fields.org,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Request failed');

      setSuccessData({ mailto: data.mailto ?? '', name: fields.name, email: fields.email });
      setSubmitted(true);
      onSuccess?.(data.mailto ?? '', fields.name, fields.email);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Transmission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [fields, onSuccess]);

  return {
    fields,
    errors,
    submitting,
    submitError,
    submitted,
    successData,
    handleChange,
    handleBlur,
    handleSubmit,
    handleReset,
  };
}
