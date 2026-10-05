import { useCallback, useEffect, useMemo, useState } from 'react';
import { getProducts, deleteProduct, parseError } from '../api.js';
import ProductForm from './ProductForm.jsx';

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
const LOW_STOCK = 10;

export default function Products({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [formFor, setFormFor] = useState(null); // null = closed, {} = add, product = edit
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getProducts();
      setProducts(data.data);
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.product_name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const stockValue = useMemo(
    () => products.reduce((sum, p) => sum + p.price * p.quantity, 0),
    [products]
  );

  const handleSaved = (saved, message) => {
    setProducts((list) =>
      list.some((p) => p.id === saved.id)
        ? list.map((p) => (p.id === saved.id ? saved : p))
        : [saved, ...list]
    );
    setFormFor(null);
    setToast(message);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteProduct(toDelete.id);
      setProducts((list) => list.filter((p) => p.id !== toDelete.id));
      setToast('Product deleted.');
      setToDelete(null);
    } catch (err) {
      setToast(parseError(err).message);
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">Stockroom</div>
        <div className="who">
          <span>Signed in as <strong>{user.username}</strong></span>
          <button className="btn" onClick={onLogout}>Log out</button>
        </div>
      </header>

      <main className="content">
        <div className="page-head">
          <div>
            <h1>Products</h1>
            <p className="muted">
              {products.length} item{products.length === 1 ? '' : 's'} · stock value {peso.format(stockValue)}
            </p>
          </div>
          <button className="btn primary" onClick={() => setFormFor({})}>Add product</button>
        </div>

        <input
          className="search"
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
        />

        {error && (
          <div className="alert" role="alert">
            {error} <button className="link" onClick={load}>Try again</button>
          </div>
        )}

        {loading ? (
          <p className="muted pad">Loading products…</p>
        ) : filtered.length === 0 ? (
          <p className="empty">
            {products.length === 0 ? 'No products yet. Add your first one.' : 'No products match your search.'}
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th className="num">Price</th>
                  <th className="num">Qty</th>
                  <th>Added</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.id}</td>
                    <td>
                      <div className="name">{p.product_name}</div>
                      {p.description && <div className="desc">{p.description}</div>}
                    </td>
                    <td className="num mono">{peso.format(p.price)}</td>
                    <td className="num">
                      <span className={p.quantity <= LOW_STOCK ? 'qty low' : 'qty'}>{p.quantity}</span>
                    </td>
                    <td className="muted nowrap">{p.created_at ? p.created_at.slice(0, 10) : ''}</td>
                    <td className="row-actions">
                      <button className="btn sm" onClick={() => setFormFor(p)}>Edit</button>
                      <button className="btn sm danger" onClick={() => setToDelete(p)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {formFor && (
        <ProductForm
          product={formFor.id ? formFor : null}
          onClose={() => setFormFor(null)}
          onSaved={handleSaved}
        />
      )}

      {toDelete && (
        <div className="overlay" role="alertdialog" aria-modal="true" onMouseDown={() => setToDelete(null)}>
          <div className="modal small" onMouseDown={(e) => e.stopPropagation()}>
            <h2>Delete product?</h2>
            <p>
              <strong>{toDelete.product_name}</strong> will be permanently removed.
            </p>
            <div className="actions">
              <button className="btn" onClick={() => setToDelete(null)} disabled={deleting}>Cancel</button>
              <button className="btn danger solid" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
