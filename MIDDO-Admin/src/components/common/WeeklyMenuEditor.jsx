import React, {useEffect, useMemo, useState} from 'react';
import {mealTypeOptions, productIconOptions} from '../../constants/adminConfig';

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const emptyWeeklyMenuItem = day => ({
  day,
  icon: '🍱',
  title: '',
  items: '',
  mealType: 'Lunch',
  price: '',
  isAvailable: true,
});

const emptySampleMenuItem = () => ({
  icon: '🍱',
  title: '',
  items: '',
  price: '',
  isAvailable: true,
});

const normalizeMenu = value => {
  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const stringifyMenu = menu => JSON.stringify(menu, null, 2);

export function WeeklyMenuEditor({mode = 'weekly', value, onChange}) {
  const [jsonDraft, setJsonDraft] = useState(value || '[]');
  const [jsonError, setJsonError] = useState('');
  const menu = useMemo(() => normalizeMenu(value), [value]);
  const usedDays = new Set(menu.map(item => item.day));
  const nextDay = days.find(day => !usedDays.has(day)) || 'MON';
  const isWeekly = mode === 'weekly';

  useEffect(() => {
    setJsonDraft(value || '[]');
    setJsonError('');
  }, [value]);

  const syncMenu = nextMenu => {
    const nextValue = stringifyMenu(nextMenu);
    setJsonDraft(nextValue);
    setJsonError('');
    onChange(nextValue);
  };

  const updateItem = (index, key, nextValue) => {
    syncMenu(
      menu.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: key === 'isAvailable' ? nextValue === true || nextValue === 'true' : nextValue,
            }
          : item,
      ),
    );
  };

  const addItem = () => {
    syncMenu([...menu, isWeekly ? emptyWeeklyMenuItem(nextDay) : emptySampleMenuItem()]);
  };

  const removeItem = index => {
    syncMenu(menu.filter((_, itemIndex) => itemIndex !== index));
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft || '[]');

      if (!Array.isArray(parsed)) {
        setJsonError(`${isWeekly ? 'Weekly' : 'Sample'} menu JSON must be an array.`);
        return;
      }

      syncMenu(parsed);
    } catch {
      setJsonError('JSON format is invalid.');
    }
  };

  return (
    <div className="weekly-menu-editor">
      <div className="weekly-menu-head">
        <div>
          <strong>{isWeekly ? 'Weekly Menu Builder' : 'Sample Menu Builder'}</strong>
          <span>{isWeekly ? 'Add food day-wise without writing JSON.' : 'Add the showcase dishes shown in the app.'}</span>
        </div>
        <button type="button" onClick={addItem}>
          {isWeekly ? 'Add Day' : 'Add Item'}
        </button>
      </div>

      <div className="weekly-menu-list">
        {menu.map((item, index) => (
          <section className="weekly-menu-row" key={`${item.day}-${index}`}>
            <div className="weekly-menu-row-head">
              <strong>{isWeekly ? item.day || `Day ${index + 1}` : `Item ${index + 1}`}</strong>
              <label className="availability-toggle">
                <input
                  checked={item.isAvailable !== false}
                  onChange={event => updateItem(index, 'isAvailable', event.target.checked)}
                  type="checkbox"
                />
                Available
              </label>
              <button type="button" onClick={() => removeItem(index)}>
                Remove
              </button>
            </div>
            <div className="weekly-menu-fields">
              {isWeekly ? (
                <label>
                  Day
                  <select value={item.day || ''} onChange={event => updateItem(index, 'day', event.target.value)}>
                    {days.map(day => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label>
                Icon
                <select value={item.icon || '🍱'} onChange={event => updateItem(index, 'icon', event.target.value)}>
                  {productIconOptions.map(icon => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {isWeekly ? 'Food Name' : 'Dish Name'}
                <input
                  value={item.title || ''}
                  onChange={event => updateItem(index, 'title', event.target.value)}
                  placeholder="Dal Makhani Thali"
                />
              </label>
              {isWeekly ? (
                <label>
                  Meal Type
                  <select
                    value={item.mealType || 'Lunch'}
                    onChange={event => updateItem(index, 'mealType', event.target.value)}
                  >
                    {mealTypeOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="weekly-menu-items">
                Items
                <input
                  value={item.items || ''}
                  onChange={event => updateItem(index, 'items', event.target.value)}
                  placeholder="Dal, Roti, Rice, Salad"
                />
              </label>
              <label>
                Price
                <input
                  value={item.price || ''}
                  onChange={event => updateItem(index, 'price', event.target.value)}
                  placeholder="₹99"
                />
              </label>
            </div>
          </section>
        ))}
      </div>

      <details className="weekly-json-panel">
        <summary>Advanced JSON</summary>
        <textarea
          value={jsonDraft}
          onChange={event => {
            setJsonDraft(event.target.value);
            setJsonError('');
          }}
          spellCheck={false}
        />
        <div className="weekly-json-actions">
          {jsonError ? <span>{jsonError}</span> : <span>JSON stays synced with the builder above.</span>}
          <button type="button" onClick={applyJson}>
            Apply JSON
          </button>
        </div>
      </details>
    </div>
  );
}
