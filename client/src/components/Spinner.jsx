export default function Spinner({ size = '8' }) {
  return (
    <div className={`inline-block h-${size} w-${size} animate-spin rounded-full border-2 border-coffee-300 border-t-coffee-700`} />
  )
}

