import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn(
      "container mx-auto px-4 sm:px-6 lg:px-8 py-8",
      "mt-20", // Pour descendre le contenu en dessous du header fixe
      className
    )}>
      {children}
    </div>
  );
}