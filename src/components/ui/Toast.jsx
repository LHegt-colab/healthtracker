import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 4000)
    return () => clearTimeout(timer)
  }, [onRemove])

  const isSuccess = toast.type === 'success'

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium min-w-64 ${
      isSuccess ? 'bg-teal-600' : 'bg-red-600'
    }`}>
      {isSuccess ? <CheckCircle size={18} /> : <XCircle size={18} />}
      <span className="flex-1">{toast.message}</span>
      <button onClick={onRemove} className="opacity-70 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  )
}
