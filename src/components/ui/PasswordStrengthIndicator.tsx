'use client';

interface Props {
  password: string;
}

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function computeStrength(password: string): {
  level: StrengthLevel;
  label: string;
  color: string;
} {
  if (!password) return { level: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Слабкий пароль', color: '#E24B4A' };
  if (score === 2) return { level: 2, label: 'Середній пароль', color: '#EF9F27' };
  if (score === 3) return { level: 3, label: 'Хороший пароль', color: '#EF9F27' };
  return { level: 4, label: 'Надійний пароль', color: '#639922' };
}

export function PasswordStrengthIndicator({ password }: Props) {
  const { level, label, color } = computeStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {([1, 2, 3, 4] as const).map((i) => (
          <div
            key={i}
            className="h-[3px] flex-1 rounded-[2px] transition-colors"
            style={{ backgroundColor: i <= level ? color : '#e5e7eb' }}
          />
        ))}
      </div>
      <p className="mt-1 text-[12px]" style={{ color }}>
        {label}
      </p>
    </div>
  );
}
