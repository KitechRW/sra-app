import { X } from 'lucide-react'
export default function Modal({ title, subtitle, onClose, children, size = 'md' }) {
  const widths = { sm:'max-w-md', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-3xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-black/40 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${widths[size]}`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div><h3 className="font-black text-navy">{title}</h3>{subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}</div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all"><X size={18}/></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
