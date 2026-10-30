import React, { useState } from 'react';
import { PlusCircleIcon, CheckCircleIcon, AlertTriangleIcon } from './Icons';

export function AddItemForm({ onItemAdded }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Client-side validations
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFeedback({ type: 'error', message: 'Item name cannot be empty.' });
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFeedback({ type: 'error', message: 'Price must be a valid non-negative number.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          price: parsedPrice,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || `HTTP ${response.status} failed`);
      }

      setFeedback({
        type: 'success',
        message: `Item "${data.name || trimmedName}" successfully created with ID #${data.id || 'N/A'}!`,
      });

      // Reset form
      setName('');
      setPrice('');

      // Refresh table in parent
      if (onItemAdded) {
        onItemAdded();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to submit item to database.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <PlusCircleIcon color="var(--primary)" />
          <span>Add New Item</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="itemName">Item Name</label>
          <input
            id="itemName"
            type="text"
            className="form-input"
            placeholder="e.g. Mechanical Keyboard"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="itemPrice">Price (USD)</label>
          <input
            id="itemPrice"
            type="number"
            step="0.01"
            min="0"
            className="form-input mono"
            placeholder="e.g. 129.99"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        {feedback && (
          <div
            className={feedback.type === 'success' ? 'success-box' : 'error-box'}
            style={{ marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}
          >
            {feedback.type === 'success' ? (
              <CheckCircleIcon size={16} color="var(--success)" />
            ) : (
              <AlertTriangleIcon size={16} color="var(--danger)" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.5rem' }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner" />
              <span>Inserting into MySQL...</span>
            </>
          ) : (
            <>
              <PlusCircleIcon size={15} />
              <span>Add Item to Database</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
