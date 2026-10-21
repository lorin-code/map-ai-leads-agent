type IconProps = {
  className?: string;
};

function IconBase({ children, className }: IconProps & { children: React.ReactNode }) {
  return (
    <svg aria-hidden="true" className={className ?? "landing-icon"} fill="none" viewBox="0 0 24 24">
      {children}
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.5 13.7 9l5.3 1.7-5.3 1.7L12 18l-1.7-5.6L5 10.7 10.3 9 12 3.5Z" />
      <path d="M18.5 15.5 19.2 18l2.3.7-2.3.8-.7 2.5-.8-2.5-2.2-.8 2.2-.7.8-2.5Z" />
    </IconBase>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h13" />
      <path d="m13 7 5 5-5 5" />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="10.5" cy="10.5" r="5.5" />
      <path d="m15 15 4 4" />
    </IconBase>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
      <path d="m4 12 8 4.5 8-4.5" />
      <path d="m4 16.5 8 4.5 8-4.5" />
    </IconBase>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </IconBase>
  );
}

export function ExportIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </IconBase>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </IconBase>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 19V5" />
      <path d="M5 19h14" />
      <path d="M8.5 15v-4" />
      <path d="M12 15V8" />
      <path d="M15.5 15v-6" />
    </IconBase>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m5 12 4 4L19 6" />
    </IconBase>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8.4 5.2 10 8.8l-1.2 1.1a11.2 11.2 0 0 0 5.3 5.3l1.1-1.2 3.6 1.6-.6 3.2c-.2.8-.9 1.3-1.7 1.2C9.8 19.5 4.5 14.2 4 7.5c-.1-.8.4-1.5 1.2-1.7l3.2-.6Z" />
    </IconBase>
  );
}

export function StoreIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 10h14" />
      <path d="M6.5 10 8 4h8l1.5 6" />
      <path d="M7 10v9h10v-9" />
      <path d="M10 19v-5h4v5" />
    </IconBase>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 4 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L12 4Z" />
    </IconBase>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 8h10v10H8z" />
      <path d="M6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </IconBase>
  );
}
