/**
 * 대표 사주 변경 확인 다이얼로그
 */

import { ConfirmDialog } from './ConfirmDialog';

interface PrimarySajuChangeDialogProps {
  isOpen: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PrimarySajuChangeDialog({ isOpen, isLoading = false, onConfirm, onCancel }: PrimarySajuChangeDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="대표 사주를 변경하시겠어요?"
      confirmLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
