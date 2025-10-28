import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import MenuList from '../components/MenuList.jsx'
import Spinner from '../components/Spinner.jsx'
import { useToast } from '../components/ToastProvider.jsx'

export default function TablePage() {
  const { cafeId, tableId } = useParams()
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState([])
  const [message, setMessage] = useState('')
  const [lastOrders, setLastOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    setLoading(true)
    axios.get('/api/menu', { params: { cafeId } }).then((res) => setMenu(res.data)).finally(()=>setLoading(false))
  }, [cafeId])

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await axios.get('/api/orders', { params: { cafeId, tableId } })
      setLastOrders(res.data)
    }
    fetchOrders()
    const id = setInterval(fetchOrders, 5000)
    return () => clearInterval(id)
  }, [cafeId, tableId])

  const total = useMemo(() => cart.reduce((sum, it) => sum + it.price * it.qty, 0), [cart])
  const qtyMap = useMemo(() => cart.reduce((m, it) => (m[it.id]=it.qty, m), {}), [cart])

  function addToCart(item) {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 }
        return copy
      }
      return [...prev, { ...item, qty: 1, notes: '' }]
    })
  }

  function decFromCart(item) {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id)
      if (idx === -1) return prev
      const copy = [...prev]
      const nextQty = copy[idx].qty - 1
      if (nextQty <= 0) return copy.filter((x) => x.id !== item.id)
      copy[idx] = { ...copy[idx], qty: nextQty }
      return copy
    })
  }

  function updateQty(id, qty) {
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)))
  }

  function updateNotes(id, notes) {
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, notes } : i)))
  }

  async function submitOrder() {
    try {
      const payload = {
        cafeId: Number(cafeId),
        tableId: Number(tableId),
        items: cart.map((c) => ({ menuItemId: c.id, qty: c.qty, notes: c.notes || undefined })),
      }
      await axios.post('/api/orders', payload)
      setCart([])
      toast.show('Order sent ✅', 'success')
    } catch (e) {
      toast.show('Error sending order ❌', 'error')
    }
  }

  async function quickRequest(type) {
    try {
      await axios.post('/api/requests', { cafeId: Number(cafeId), tableId: Number(tableId), type })
      toast.show(`${type[0].toUpperCase() + type.slice(1)} request sent ✅`)
    } catch (e) {
      toast.show('Failed to send request ❌', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">CafeConnect — Table {tableId}</h1>
        <div className="hidden md:flex gap-2">
          <button className="btn-ghost" onClick={() => quickRequest('water')}>💧 Water</button>
          <button className="btn-ghost" onClick={() => quickRequest('bill')}>🧾 Bill</button>
          <button className="btn-ghost" onClick={() => quickRequest('waiter')}>👋 Waiter</button>
        </div>
      </header>

      <div className="md:hidden flex gap-2">
        <button className="btn w-full" onClick={() => quickRequest('water')}>💧 Ask for water</button>
        <button className="btn w-full" onClick={() => quickRequest('bill')}>🧾 Ask for bill</button>
        <button className="btn w-full" onClick={() => quickRequest('waiter')}>👋 Call waiter</button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="10" /></div>
          ) : (
            <MenuList menu={menu} onAdd={addToCart} onDec={decFromCart} qtyMap={qtyMap} />
          )}
          <section>
            <h2 className="text-xl font-semibold mb-2">Last Orders</h2>
            <div className="space-y-2">
              {lastOrders.map((o) => (
                <div key={o.id} className="card">
                  <div className="font-medium">Order #{o.id} — {o.status}</div>
                  <ul className="list-disc pl-6 text-sm text-gray-700">
                    {o.items.map((it) => (
                      <li key={it.id}>{it.quantity} x {it.menuItem.name}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="hidden md:block md:col-span-1">
          <div className="card sticky top-4">
            <h2 className="text-xl font-semibold mb-2">Your Cart</h2>
            {cart.length === 0 ? (
              <div className="text-gray-500">Cart is empty</div>
            ) : (
              <div className="space-y-2">
                {cart.map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="font-medium flex-1">{c.name}</div>
                    <div className="flex items-center gap-2">
                      <button className="btn-ghost" onClick={()=>decFromCart(c)}>-</button>
                      <span>{c.qty}</span>
                      <button className="btn" onClick={()=>addToCart(c)}>+</button>
                    </div>
                    <div className="w-24 text-right">${(c.price * c.qty).toFixed(2)}</div>
                  </div>
                ))}
                <input className="input" placeholder="Notes (optional) — apply per item in menu" disabled />
                <div className="flex justify-between font-semibold">
                  <div>Total</div>
                  <div>${total.toFixed(2)}</div>
                </div>
                <button className="btn w-full" onClick={submitOrder}>Submit order</button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile cart fixed bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-soft border-t p-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Cart · ${total.toFixed(2)}</div>
          <button className="btn" onClick={submitOrder} disabled={cart.length===0}>Submit</button>
        </div>
      </div>
    </div>
  )
}
