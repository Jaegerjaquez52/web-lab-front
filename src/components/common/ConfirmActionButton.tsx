import { useState, type ReactNode } from 'react';
import ConfirmDialog from './ConfirmDialog';
import Button from './Button';

interface ConfirmActionButtonProps {
  children: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  isPending?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
}

export default function ConfirmActionButton({
  children,
  title,
  description,
  confirmLabel,
  size = 'sm',
  isPending = false,
  disabled = false,
  onConfirm,
}: ConfirmActionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size={size} variant="danger" disabled={isPending || disabled} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        isPending={isPending}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          onConfirm();
          setOpen(false);
        }}
      />
    </>
  );
}
