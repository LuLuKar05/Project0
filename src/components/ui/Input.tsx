'use client';

interface InputProps {
  type?:        'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
  label?:       string;
  placeholder?: string;
  options?:     string[];   // required when type="select"
  value?:       string;
  onChange?:    (value: string) => void;
  error?:       string;
  success?:     string;
  disabled?:    boolean;
  rows?:        number;     // textarea only, default 4
  onFocus?:     () => void;
  onBlur?:      () => void;
}

export default function Input({
  type = 'text',
  label,
  placeholder,
  options = [],
  value,
  onChange,
  error,
  success,
  disabled = false,
  rows = 4,
  onFocus,
  onBlur,
}: InputProps) {
  const isControlled = value !== undefined && onChange !== undefined;

  const borderClass = error
    ? 'border-error focus:border-error'
    : success
    ? 'border-success focus:border-success'
    : 'border-[rgba(255,98,0,0.2)] focus:border-[#ff8a3d] focus:shadow-[0_0_0_1px_rgba(255,138,61,0.2),0_0_22px_rgba(255,98,0,0.12)]';

  const fieldClass = [
    'w-full bg-[rgba(12,8,4,0.7)] border',
    'text-white font-gx-body text-[15px]',
    'px-[15px] py-[13px] outline-none transition-all duration-300',
    'placeholder:text-[rgba(255,255,255,0.28)]',
    disabled ? 'opacity-40 cursor-not-allowed' : '',
    borderClass,
  ].join(' ');

  type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  const sharedProps = {
    placeholder,
    disabled,
    onFocus,
    onBlur,
    className: fieldClass,
    ...(isControlled ? { value, onChange: (e: ChangeEvent) => onChange!(e.target.value) } : {}),
  };

  return (
    <div className="mb-5">
      {label && (
        <label className="block font-gx-mono text-[10px] tracking-[0.14em] text-primary uppercase mb-[9px]">
          {label}
        </label>
      )}

      {type === 'textarea' && (
        <textarea
          {...(sharedProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          rows={rows}
          style={{ resize: 'vertical', lineHeight: '1.6' }}
        />
      )}

      {type === 'select' && (
        <select
          {...(sharedProps as React.SelectHTMLAttributes<HTMLSelectElement>)}
          style={{
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `linear-gradient(45deg,transparent 50%,#ff6200 50%),linear-gradient(135deg,#ff6200 50%,transparent 50%)`,
            backgroundPosition: 'calc(100% - 18px) center, calc(100% - 13px) center',
            backgroundSize: '5px 5px, 5px 5px',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {options.map(opt => (
            <option key={opt} value={opt} style={{ background: '#0a0a12' }}>{opt}</option>
          ))}
        </select>
      )}

      {type !== 'textarea' && type !== 'select' && (
        <input
          type={type}
          {...(sharedProps as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {error && (
        <p className="mt-[6px] font-gx-mono text-[10px] tracking-[0.05em] text-error">{error}</p>
      )}
      {success && !error && (
        <p className="mt-[6px] font-gx-mono text-[10px] tracking-[0.05em] text-success">{success}</p>
      )}
    </div>
  );
}
