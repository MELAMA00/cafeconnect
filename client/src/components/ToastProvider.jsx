import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext({
  show: (msg, type='success') => {},
})

export function useToast() {
  return useContext(ToastCtx)
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type='success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), 2500)
  }, [])

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className={`card animate-fade ${t.type==='error' ? 'border-red-300 bg-red-50 text-red-800' : 'border-green-300 bg-green-50 text-green-800'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

