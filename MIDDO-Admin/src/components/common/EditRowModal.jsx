import React from 'react';
import {mealTypeOptions, productIconOptions, productStatusOptions, productTagOptions, trackingStatuses} from '../../constants/adminConfig';
import {WeeklyMenuEditor} from './WeeklyMenuEditor';
import {getCategoryOptions, getRowLabel} from '../../utils/adminUtils';

export function EditRowModal({
  categories,
  homeChefs = [],
  onChange,
  onClose,
  onSubmit,
  row,
  table,
  values,
}) {
  const categoryOptions = getCategoryOptions(categories);
  const rowTitle = getRowLabel(row);
  const locationFields = {
    customers: ['name', 'email', 'phone', 'address', 'liveAddress', 'location', 'latitude', 'longitude'],
    homeChefs: ['name', 'owner', 'email', 'phone', 'address', 'liveAddress', 'location', 'latitude', 'longitude'],
  };
  const fields = [...new Set([...(locationFields[table] || []), ...Object.keys(values || {})])].filter(
    field => !(table === 'customers' && field === 'avatar'),
  );
  const canUpdateLiveAddress = ['customers', 'homeChefs'].includes(table);
  const chefOptions = (homeChefs || []).map(chef => ({
    id: chef._id,
    label: `${chef.name || 'Kitchen'}${chef.owner ? ` · ${chef.owner}` : ''}`,
    name: chef.name || '',
  }));
  const changeRequestReasons = [
    'Food quality not satisfactory',
    'Portion sizes too small',
    'Delivery frequently late',
    'Menu variety too limited',
    'Hygiene concerns',
    'Other reason',
  ];
  const getFieldLabel = field => {
    if (table === 'homeChefChangeRequests') {
      const labels = {
        currentChefId: 'Current HomeChef',
        currentChefName: 'Current HomeChef Name',
        requestedChefId: 'Requested HomeChef',
        requestedChefName: 'Requested HomeChef Name',
        assignedChefId: 'Assign New HomeChef',
        assignedChefName: 'Assigned HomeChef Name',
        adminNote: 'Admin Note',
        requestId: 'Request ID',
      };

      if (labels[field]) {
        return labels[field];
      }
    }

    return field.replace(/([A-Z])/g, ' $1');
  };

  const getOptionsForField = field => {
    if (field === 'day') {
      return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    }
    if (['image', 'icon', 'avatar'].includes(field)) {
      return productIconOptions;
    }
    if (field === 'category') {
      return categoryOptions.map(category => category.label);
    }
    if (field === 'mealType') {
      return mealTypeOptions;
    }
    if (field === 'tags') {
      return productTagOptions;
    }
    if (field === 'status') {
      if (table === 'homeChefChangeRequests') {
        return ['Pending Admin Approval', 'Approved', 'Rejected', 'Assigned'];
      }

      return [
        ...new Set([
          ...productStatusOptions,
          'Visible',
          'Hidden',
          'Enabled',
          'Disabled',
          'Draft',
          'Review',
          'Scheduled',
          'Paid',
          'Pending',
          ...trackingStatuses,
        ]),
      ];
    }
    if (field === 'paymentMethod') {
      return ['UPI', 'Credit Card', 'Debit Card', 'Net Banking'];
    }
    if (field === 'paymentProvider') {
      return ['Razorpay', 'Cashfree'];
    }
    if (field === 'paymentStatus') {
      return ['Paid', 'Pending', 'Failed', 'Refunded'];
    }
    if (field === 'priority') {
      return ['Low', 'Medium', 'High'];
    }
    if (field === 'channel') {
      return ['WhatsApp', 'AI Chatbot', 'Help Center', 'Phone', 'Email'];
    }
    if (field === 'role') {
      return ['customer', 'homechefs', 'rider', 'admin'];
    }
    if (table === 'homeChefChangeRequests' && field === 'reason') {
      return changeRequestReasons;
    }

    return null;
  };

  const renderField = field => {
    const value = values[field] ?? '';
    const options = getOptionsForField(field);
    const originalValue = row?.[field];

    if (table === 'homeChefChangeRequests' && ['currentChefId', 'requestedChefId', 'assignedChefId'].includes(field)) {
      const nameField =
        field === 'currentChefId'
          ? 'currentChefName'
          : field === 'requestedChefId'
            ? 'requestedChefName'
            : 'assignedChefName';

      return (
        <select
          value={value}
          onChange={event => {
            const selectedChef = chefOptions.find(chef => chef.id === event.target.value);
            onChange(field, event.target.value);
            if (selectedChef) {
              onChange(nameField, selectedChef.name);
            }
          }}>
          <option value="">Select HomeChef</option>
          {!chefOptions.some(chef => chef.id === value) && value ? (
            <option value={value}>{values[nameField] || value}</option>
          ) : null}
          {chefOptions.map(chef => (
            <option key={chef.id} value={chef.id}>
              {chef.label}
            </option>
          ))}
        </select>
      );
    }

    if (typeof originalValue === 'boolean') {
      return (
        <select value={String(value)} onChange={event => onChange(field, event.target.value)}>
          <option value="true">Active / True</option>
          <option value="false">Inactive / False</option>
        </select>
      );
    }

    if (options) {
      return (
        <select value={value} onChange={event => onChange(field, event.target.value)}>
          {!options.includes(value) ? <option value={value}>{value || 'Select'}</option> : null}
          {options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (
      ['description', 'address', 'issue', 'text', 'note', 'notes', 'adminNote', 'meta', 'chef', 'cuisine', 'weeklyMenu', 'sampleMenu'].includes(field)
    ) {
      if (field === 'weeklyMenu' || field === 'sampleMenu') {
        return (
          <WeeklyMenuEditor
            mode={field === 'sampleMenu' ? 'sample' : 'weekly'}
            value={value}
            onChange={nextValue => onChange(field, nextValue)}
          />
        );
      }

      return (
        <textarea value={value} onChange={event => onChange(field, event.target.value)} />
      );
    }

    if (typeof originalValue === 'number' || ['latitude', 'longitude'].includes(field)) {
      return (
        <input
          type="number"
          value={value}
          onChange={event => onChange(field, event.target.value)}
        />
      );
    }

    return <input value={value} onChange={event => onChange(field, event.target.value)} />;
  };

  const reverseGeocode = async (latitude, longitude) => {
    const fallbackAddress = `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
    );
    const data = await response.json();

    return data.display_name || fallbackAddress;
  };

  const applyLiveLocation = (latitude, longitude, address) => {
    const locationLabel = address.split(',').slice(0, 3).join(', ') || address;

    onChange('latitude', Number(latitude.toFixed(6)));
    onChange('longitude', Number(longitude.toFixed(6)));
    onChange('liveAddress', address);
    onChange('address', address);
    onChange('location', locationLabel);
  };

  const updateLiveAddressFromCurrentLocation = async () => {
    if (!navigator.geolocation) {
      const latitude = Number(values.latitude);
      const longitude = Number(values.longitude);

      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        applyLiveLocation(latitude, longitude, `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`);
        return;
      }

      onChange('liveAddress', 'Current location is not available in this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        const fallbackAddress = `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`;

        try {
          const address = await reverseGeocode(latitude, longitude);
          applyLiveLocation(latitude, longitude, address);
        } catch {
          applyLiveLocation(latitude, longitude, fallbackAddress);
        }
      },
      () => {
        const latitude = Number(values.latitude);
        const longitude = Number(values.longitude);

        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          applyLiveLocation(latitude, longitude, `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`);
          return;
        }

        onChange('liveAddress', 'Location permission denied or unavailable');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 },
    );
  };

  if (table === 'homeChefChangeRequests') {
    const currentChefLabel = values.currentChefName || row?.currentChefName || 'Not selected';
    const requestedChefLabel = values.requestedChefName || row?.requestedChefName || 'No preference';
    const assignedChefLabel = values.assignedChefName || row?.assignedChefName || 'Not assigned yet';
    const summaryItems = [
      ['Request ID', values.requestId || '-'],
      ['Customer', values.customerName || '-'],
      ['Phone', values.customerPhone || '-'],
      ['Current HomeChef', currentChefLabel],
      ['Preferred HomeChef', requestedChefLabel],
      ['Reason', values.reason || '-'],
    ];
    const useRequestedChef = () => {
      if (!values.requestedChefId) {
        return;
      }

      onChange('assignedChefId', values.requestedChefId);
      onChange('assignedChefName', values.requestedChefName || '');
    };

    return (
      <div className="modal-overlay" role="presentation">
        <div className="edit-modal change-request-modal" role="dialog" aria-modal="true" aria-label={`Update ${rowTitle}`}>
          <div className="modal-head">
            <div>
              <p className="eyebrow">Update HomeChef Change Request</p>
              <h2>{values.requestId || rowTitle}</h2>
            </div>
            <button type="button" onClick={onClose}>Close</button>
          </div>
          <form className="edit-form change-request-form" onSubmit={onSubmit}>
            <section className="request-summary-card">
              <div className="request-summary-head">
                <div>
                  <span>Request Details</span>
                  <strong>{values.customerName || 'MIDDO Customer'}</strong>
                </div>
                <em>{values.status || 'Pending Admin Approval'}</em>
              </div>
              <div className="request-summary-grid">
                {summaryItems.map(([label, text]) => (
                  <div key={label} className="request-readonly-field">
                    <span>{label}</span>
                    <strong>{text}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="request-action-card">
              <div className="request-action-head">
                <span>Admin Action</span>
                <strong>Assign or update request status</strong>
              </div>
              <label>
                Status
                {renderField('status')}
              </label>
              <label>
                Assign New HomeChef
                {renderField('assignedChefId')}
              </label>
              {values.requestedChefId ? (
                <button className="ghost-action" type="button" onClick={useRequestedChef}>
                  Use Requested HomeChef
                </button>
              ) : null}
              <div className="request-readonly-field selected-chef">
                <span>Selected HomeChef</span>
                <strong>{assignedChefLabel}</strong>
              </div>
              <label className="wide">
                Admin Note
                {renderField('adminNote')}
              </label>
            </section>

            <div className="modal-actions">
              <button type="button" onClick={onClose}>Cancel</button>
              <button className="form-primary" type="submit">Save Decision</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" role="presentation">
      <div className="edit-modal" role="dialog" aria-modal="true" aria-label={`Update ${rowTitle}`}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">Update {table}</p>
            <h2>{rowTitle}</h2>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <form className="edit-form" onSubmit={onSubmit}>
          {canUpdateLiveAddress ? (
            <section className="request-action-card wide">
              <div className="request-action-head">
                <span>Live Address</span>
                <strong>Use current location and update coordinates</strong>
              </div>
              <button className="ghost-action" type="button" onClick={updateLiveAddressFromCurrentLocation}>
                Use Current Location
              </button>
              <div className="request-readonly-field selected-chef">
                <span>Current Live Address</span>
                <strong>{values.liveAddress || values.address || values.location || '-'}</strong>
              </div>
            </section>
          ) : null}
          {fields.map(field => {
            const isWide = ['description', 'address', 'liveAddress', 'issue', 'text', 'note', 'notes', 'meta', 'chef', 'weeklyMenu', 'sampleMenu'].includes(field);

            if (field === 'weeklyMenu' || field === 'sampleMenu') {
              return (
                <div key={field} className="edit-field-group wide">
                  <span>{getFieldLabel(field)}</span>
                  {renderField(field)}
                </div>
              );
            }

            return (
              <label key={field} className={isWide ? 'wide' : undefined}>
                {getFieldLabel(field)}
                {renderField(field)}
              </label>
            );
          })}
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button className="form-primary" type="submit">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
