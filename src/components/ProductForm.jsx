import { useState } from 'react';
import { createProduct, updateProduct, parseError } from '../api.js';

const EMPTY = { product_name: '', description: '', price: '', quantity: '' };

/** Modal form used for both "Add product" and "Edit product". */
export default function ProductForm({ product, onClose, onSaved }) {
  const editing = Boolean(product);
  const [form, setForm] = useState(
    editing
      ? {
          product_name: product.product_name,
          description: product.description ?? '',
          price: String(product.price),
          quantity: String(product.quantity),
        }
      : EMPTY
  );
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFields({});

    const payload = {
      product_name: form.product_name,
      description: form.description,
      price: form.price,
      quantity: form.quantity,
    };

    try {
      const { data } = editing
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);
      onSaved(data.data, editing ? 'Product updated.' : 'Product added.');
    } catch (err) {
      const parsed = parseError(err);
      setError(parsed.message);
      setFields(parsed.fields);
      setBusy(false);
    }
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="form-title" onMouseDown={onClose}>
      <form className="modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()} noValidate>
        <h2 id="form-title">{editing ? 'Edit product' : 'Add product'}</h2>

        {error && <div className="alert" role="alert">{error}</div>}

        <label>
          Product name
          <input value={form.product_name} onChange={set('product_name')} maxLength={100} autoFocus required />
          {fields.product_name && <span className="field-error">{fields.product_name}</span>}
        </label>

        <label>
          Description
          <textarea rows={3} value={form.description} onChange={set('description')} />
          {fields.description && <span className="field-error">{fields.description}</span>}
        </label>

        <div className="row">
          <label>
            Price (₱)
            <input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} required />
            {fields.price && <span className="field-error">{fields.price}</span>}
          </label>
          <label>
            Quantity
            <input type="number" step="1" min="0" value={form.quantity} onChange={set('quantity')} required />
            {fields.quantity && <span className="field-error">{fields.quantity}</span>}
          </label>
        </div>

        <div className="actions">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn primary" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </form>
    </div>
  );
}
