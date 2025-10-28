import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import Spinner from '../components/Spinner.jsx'
import { useToast } from '../components/ToastProvider.jsx'

export default function AdminPage() {
  const [orders, setOrders] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders')
  const [menu, setMenu] = useState([])
  const [newItem, setNewItem] = useState({ name: '', category: '', price: '', description: '', imageUrl: '' })
  const navigate = useNavigate()
  const toast = useToast()

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    navigate('/login')
  }

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ordersRes, requestsRes] = await Promise.all([
          api.get('/orders'),
          api.get('/requests'),
        ])
        setOrders(ordersRes.data.filter(o => o.status !== 'paid'))
        setRequests(requestsRes.data)
      } catch (e) {
        toast.show('Failed to load data', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
    const id = setInterval(fetchAll, 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => { fetchMenu() }, [])

  async function fetchMenu() {
    try {
      const res = await api.get('/menu')
      setMenu(res.data)
    } catch {
      // ignore
    }
  }

  async function updateOrderStatus(id, status) {
    await api.put(`/orders/${id}/status`, { status })
    const res = await api.get('/orders')
    setOrders(res.data.filter(o => o.status !== 'paid'))
    toast.show('Saved!')
  }

  async function completeRequest(id) {
    await api.put(`/requests/${id}/status`, { status: 'done' })
    const res = await api.get('/requests')
    setRequests(res.data)
    toast.show('Request done')
  }

  async function createItem(e) {
    e.preventDefault()
    const payload = { ...newItem, price: Number(newItem.price) }
    await api.post('/menu', payload)
    setNewItem({ name: '', category: '', price: '', description: '', imageUrl: '' })
    await fetchMenu()
    toast.show('Item created')
  }

  async function saveItem(it) {
    await api.put(`/menu/${it.id}`, { name: it.name, category: it.category, price: Number(it.price), description: it.description, imageUrl: it.imageUrl, available: !it.soldOut })
    await fetchMenu()
    toast.show('Saved!')
  }

  async function toggleAvailable(it) {
    await api.put(`/menu/${it.id}/availability`, { available: it.soldOut })
    await fetchMenu()
    toast.show('Updated availability')
  }

  async function archiveItem(id) {
    await api.put(`/menu/${id}/archive`)
    await fetchMenu()
    toast.show('Archived')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-coffee-600 text-white flex items-center justify-center">CC</div>
          <h1 className="text-2xl font-semibold">CafeConnect Admin</h1>
        </div>
        <button className="btn" onClick={logout}>Logout</button>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        <aside className="md:col-span-1">
          <div className="card p-0 overflow-hidden">
            <button className={`w-full text-left px-4 py-3 hover:bg-coffee-50 ${activeTab==='orders'?'bg-coffee-100':''}`} onClick={()=>setActiveTab('orders')}>Orders</button>
            <button className={`w-full text-left px-4 py-3 hover:bg-coffee-50 ${activeTab==='requests'?'bg-coffee-100':''}`} onClick={()=>setActiveTab('requests')}>Requests</button>
            <button className={`w-full text-left px-4 py-3 hover:bg-coffee-50 ${activeTab==='menu'?'bg-coffee-100':''}`} onClick={()=>setActiveTab('menu')}>Menu Management</button>
          </div>
        </aside>

        <main className="md:col-span-4 space-y-6">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="10" /></div>
          ) : activeTab === 'menu' ? (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-2">Create Item</h2>
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={createItem}>
                  <input className="input" placeholder="Name" value={newItem.name} onChange={(e)=>setNewItem(v=>({...v,name:e.target.value}))} required />
                  <input className="input" placeholder="Category" value={newItem.category} onChange={(e)=>setNewItem(v=>({...v,category:e.target.value}))} required />
                  <input className="input" placeholder="Price" type="number" step="0.01" value={newItem.price} onChange={(e)=>setNewItem(v=>({...v,price:e.target.value}))} required />
                  <input className="input" placeholder="Image URL (optional)" value={newItem.imageUrl} onChange={(e)=>setNewItem(v=>({...v,imageUrl:e.target.value}))} />
                  <input className="input sm:col-span-2" placeholder="Description (optional)" value={newItem.description} onChange={(e)=>setNewItem(v=>({...v,description:e.target.value}))} />
                  <div className="sm:col-span-2"><button className="btn">Add</button></div>
                </form>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Menu Items</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {menu.map((m) => (
                    <MenuRow key={m.id} item={m} onSave={saveItem} onToggle={toggleAvailable} onArchive={archiveItem} />
                  ))}
                  {menu.length === 0 && <div className="text-gray-500">No items</div>}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Active Orders</h2>
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div key={o.id} className="card space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Order #{o.id} — Table {o.tableId}</div>
                        <span className="text-sm text-gray-600">{new Date(o.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <ul className="list-disc pl-5 text-sm text-gray-700">
                        {o.items.map((it) => (
                          <li key={it.id}>{it.quantity} x {it.menuItem.name}{it.notes ? ` — ${it.notes}` : ''}</li>
                        ))}
                      </ul>
                      <div className="flex gap-2">
                        <button className="btn" onClick={() => updateOrderStatus(o.id, 'preparing')}>Preparing</button>
                        <button className="btn" onClick={() => updateOrderStatus(o.id, 'served')}>Served</button>
                        <button className="btn" onClick={() => updateOrderStatus(o.id, 'paid')}>Paid</button>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && <div className="text-gray-500">No active orders</div>}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Open Requests</h2>
                <div className="space-y-3">
                  {requests.map((r) => (
                    <div key={r.id} className="card flex items-center justify-between">
                      <div>
                        <div className="font-medium capitalize">{r.type}</div>
                        <div className="text-sm text-gray-600">Table {r.tableId} — {new Date(r.createdAt).toLocaleTimeString()}</div>
                      </div>
                      <button className="btn" onClick={() => completeRequest(r.id)}>Done</button>
                    </div>
                  ))}
                  {requests.length === 0 && <div className="text-gray-500">No open requests</div>}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function MenuRow({ item, onSave, onToggle, onArchive }) {
  const [edit, setEdit] = useState({ ...item, price: Number(item.price).toFixed(2) })
  useEffect(() => { setEdit({ ...item, price: Number(item.price).toFixed(2) }) }, [item])
  return (
    <div className="card grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
      <div className="md:col-span-1 w-full h-24 bg-coffee-100 rounded-lg overflow-hidden flex items-center justify-center">
        {edit.imageUrl ? (
          <img src={edit.imageUrl} alt={edit.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-coffee-700">IMG</div>
        )}
      </div>
      <input className="input md:col-span-2" value={edit.name} onChange={(e)=>setEdit(v=>({...v,name:e.target.value}))} />
      <input className="input" value={edit.category} onChange={(e)=>setEdit(v=>({...v,category:e.target.value}))} />
      <input className="input" type="number" step="0.01" value={edit.price} onChange={(e)=>setEdit(v=>({...v,price:e.target.value}))} />
      <input className="input md:col-span-2" value={edit.description||''} onChange={(e)=>setEdit(v=>({...v,description:e.target.value}))} placeholder="Description" />
      <input className="input md:col-span-2" value={edit.imageUrl||''} onChange={(e)=>setEdit(v=>({...v,imageUrl:e.target.value}))} placeholder="Image URL" />
      <div className="flex flex-wrap gap-2 md:col-span-7">
        <button className="btn" onClick={()=>onSave({ ...edit, price: parseFloat(edit.price) })}>Save</button>
        <button className="btn" onClick={()=>onToggle(item)}>{item.soldOut ? 'Mark Available' : 'Mark Sold Out'}</button>
        <button className="btn" onClick={()=>onArchive(item.id)}>Archive</button>
      </div>
    </div>
  )
}
