export default function MenuList({ menu, onAdd, onDec, qtyMap = {} }) {
  const byCat = menu.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || []
    acc[item.category].push(item)
    return acc
  }, {})

  const categories = Object.keys(byCat)

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat}>
          <h2 className="text-xl font-semibold mb-2 capitalize">{cat}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {byCat[cat].map((item) => {
              const qty = qtyMap[item.id] || 0
              return (
                <div key={item.id} className="card animate-fade">
                  <div className="flex gap-3">
                    <div className="w-20 h-20 rounded-lg bg-coffee-100 overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-coffee-700">🍵</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-gray-600">{item.description || 'wa talian .'}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-semibold">${item.price.toFixed(2)}</span>
                        {item.soldOut ? (
                          <span className="chip">Sold out</span>
                        ) : qty > 0 ? (
                          <div className="flex items-center gap-2">
                            <button className="btn-ghost" onClick={() => onDec(item)}>-</button>
                            <span className="min-w-[1.5rem] text-center">{qty}</span>
                            <button className="btn" onClick={() => onAdd(item)}>+</button>
                          </div>
                        ) : (
                          <button className="btn" onClick={() => onAdd(item)}>Add</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
