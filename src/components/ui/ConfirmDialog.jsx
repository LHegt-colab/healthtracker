import Modal from './Modal'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-ghost">Annuleren</button>
        <button onClick={() => { onConfirm(); onClose() }} className="btn-danger">Verwijderen</button>
      </div>
    </Modal>
  )
}
