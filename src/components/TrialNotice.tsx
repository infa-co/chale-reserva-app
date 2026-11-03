import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAccess } from '@/hooks/useAccess';

export default function TrialNotice() {
  const { isTrial, trialEndsAt } = useAccess();
  if (!isTrial || !trialEndsAt) return null;
  const days = Math.max(1, Math.ceil((Date.parse(trialEndsAt) - Date.now()) / 86400000));
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-1 border-b border-border bg-muted px-4 py-2 text-sm text-foreground" role="status">
      <span>Seu teste termina em {days} {days === 1 ? 'dia' : 'dias'} ·</span>
      <Button asChild variant="link" className="h-auto p-0 text-sm"><Link to="/payment">Escolher plano</Link></Button>
    </div>
  );
}