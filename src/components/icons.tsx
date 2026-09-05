type IconProps = { className?: string };

const base = 'h-5 w-5';

export const CartIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M2.5 3h2.2l2.1 11.2a1.8 1.8 0 0 0 1.8 1.5h8.4a1.8 1.8 0 0 0 1.8-1.4L20.5 7H6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9.5" cy="20" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="17.5" cy="20" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const SearchIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" strokeLinecap="round" />
  </svg>
);

export const CloseIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
  </svg>
);

export const MenuIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
  </svg>
);

export const ChevronIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m4.5 12.5 5 5 10-11" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TruckIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M2 6.5A1.5 1.5 0 0 1 3.5 5h9A1.5 1.5 0 0 1 14 6.5V16H2z" />
    <path d="M14 9h3.6a2 2 0 0 1 1.7 1l2.2 3.4V16h-7.5" />
    <circle cx="6.5" cy="18" r="2" />
    <circle cx="17.5" cy="18" r="2" />
  </svg>
);

export const ShieldIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M12 2.8 4.5 5.8v5.6c0 4.6 3.1 8.2 7.5 9.8 4.4-1.6 7.5-5.2 7.5-9.8V5.8z" strokeLinejoin="round" />
    <path d="m8.8 12 2.2 2.2 4.2-4.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ReturnIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M3.5 8.5h11a5.5 5.5 0 0 1 0 11H8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m7.5 4.5-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SupportIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M4 13a8 8 0 0 1 16 0" strokeLinecap="round" />
    <rect x="2.5" y="13" width="4" height="6" rx="1.6" />
    <rect x="17.5" y="13" width="4" height="6" rx="1.6" />
    <path d="M20 19v.6a2.4 2.4 0 0 1-2.4 2.4H13" strokeLinecap="round" />
  </svg>
);

export const StarIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="m12 3.2 2.6 5.6 6 .8-4.4 4.2 1.1 6L12 17l-5.3 2.8 1.1-6L3.4 9.6l6-.8z" />
  </svg>
);

export const PhoneIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M6.2 3.5h3l1.5 3.8-2 1.3a11.5 11.5 0 0 0 5.2 5.2l1.3-2 3.8 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2z" strokeLinejoin="round" />
  </svg>
);

export const MailIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="2.8" y="5" width="18.4" height="14" rx="2.2" />
    <path d="m3.5 7 8.5 6 8.5-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PinIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M12 21.5s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" strokeLinejoin="round" />
    <circle cx="12" cy="10.3" r="2.6" />
  </svg>
);

export const MinusIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12h14" strokeLinecap="round" />
  </svg>
);

export const PlusIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);

export const TrashIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l.9 12.2a1.8 1.8 0 0 0 1.8 1.7h5.6a1.8 1.8 0 0 0 1.8-1.7L17.5 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LockIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.2" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" strokeLinecap="round" />
  </svg>
);
