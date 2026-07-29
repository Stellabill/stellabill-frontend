import Modal from '../common/Modal'
import Button from '../common/Button'

interface ExitConfirmModalProps {
  isOpen: boolean
  onSaveDraft: () => void
  onDiscard: () => void
  onKeepEditing: () => void
}

export default function ExitConfirmModal({
  isOpen,
  onSaveDraft,
  onDiscard,
  onKeepEditing,
}: ExitConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onKeepEditing}
      title="Unsaved changes"
      description="You have unsaved changes. Do you want to save a draft before leaving?"
      footer={
        <>
          <Button variant="ghost" onClick={onKeepEditing}>
            Keep Editing
          </Button>
          <Button variant="error" onClick={onDiscard}>
            Discard
          </Button>
          <Button variant="primary" onClick={onSaveDraft}>
            Save Draft
          </Button>
        </>
      }
    />
  )
}
