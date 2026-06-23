import Image from 'next/image';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export default function Spinner({ size = 24, className = '' }: SpinnerProps) {
  return (
    <Image
      src="/spade-logo.svg"
      alt="Loading"
      width={size}
      height={size}
      className={`animate-spin ${className}`}
    />
  );
}
