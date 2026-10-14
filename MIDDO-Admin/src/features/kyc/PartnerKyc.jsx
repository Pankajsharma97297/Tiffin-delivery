import React, {useMemo, useState} from 'react';
import {DataTable} from '../../components/common/DataTable';
import {Panel} from '../../components/common/Panel';
import {resolveImageUri} from '../../utils/imageUrl';

const getKycRows = data => [
  ...(data.vendors || []).map(row => ({...row, partnerType: 'Vendor'})),
  ...(data.riders || []).map(row => ({...row, partnerType: 'Rider'})),
];

const resolveDocumentUrl = url => {
  const resolved = resolveImageUri(url);
  return resolved || url || '';
};

export function PartnerKyc({data, onReviewKyc}) {
  const rows = getKycRows(data);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [fullImage, setFullImage] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const selectedPartner = useMemo(
    () => rows.find(row => String(row._id) === String(selectedPartnerId)) || null,
    [rows, selectedPartnerId],
  );
  const selectedDocuments = Array.isArray(selectedPartner?.kycDocuments) ? selectedPartner.kycDocuments : [];

  return (
    <>
      <Panel title="Partner KYC Verification">
        <DataTable
          actions={row => (
            <div className="row-actions">
              <button type="button" disabled={!row._id || !row.kycDocuments?.length} onClick={() => setSelectedPartnerId(row._id)}>
                View Documents
              </button>
              <button type="button" disabled={!row._id || row.kycStatus === 'Approved'} onClick={() => onReviewKyc(row, 'Approved')}>
                Approve
              </button>
              <button
                type="button"
                disabled={!row._id || row.kycStatus === 'Rejected'}
                onClick={() => {
                  setRejectTarget(row);
                  setRejectReason('');
                }}
              >
                Reject
              </button>
            </div>
          )}
          columns={['Partner', 'Type', 'Phone', 'KYC Status', 'Documents', 'Actions']}
          rows={(rows.length ? rows : [{name: 'No partners found', partnerType: '-', phone: '-', kycStatus: '-', kycDocuments: []}]).map(row => ({
            source: row,
            cells: [
              row.name,
              row.partnerType,
              row.phone || '-',
              row.kycStatus || 'Not Submitted',
              Array.isArray(row.kycDocuments) && row.kycDocuments.length
                ? `${row.kycDocuments.length} uploaded`
                : '-',
            ],
          }))}
        />
      </Panel>

      {selectedPartner ? (
        <div className="modal-overlay" role="presentation" onClick={() => setSelectedPartnerId('')}>
          <div className="edit-modal kyc-modal" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
            <button type="button" className="kyc-close-button" onClick={() => setSelectedPartnerId('')}>Close</button>
            <div className="modal-head kyc-modal-head">
              <div>
                <p className="eyebrow">KYC Documents</p>
                <h2>{selectedPartner.name}</h2>
                <span>{selectedPartner.partnerType} · {selectedPartner.phone || selectedPartner.email || '-'}</span>
              </div>
            </div>
            <div className="kyc-modal-body">
              {selectedDocuments.length ? (
                <div className="kyc-document-grid">
                  {selectedDocuments.map(document => {
                    const url = resolveDocumentUrl(document.url);
                    return (
                      <article className="kyc-document-card" key={document.key || document.url}>
                        <button type="button" className="kyc-document-image-button" onClick={() => setFullImage({label: document.label || document.key || 'Document', url})}>
                          <img src={url} alt={document.label || 'KYC document'} />
                        </button>
                        <div>
                          <strong>{document.label || document.key || 'Document'}</strong>
                          <button type="button" onClick={() => setFullImage({label: document.label || document.key || 'Document', url})}>
                            View full image
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="kyc-empty">No documents uploaded yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {fullImage ? (
        <div className="modal-overlay kyc-image-overlay" role="presentation" onClick={() => setFullImage(null)}>
          <div className="kyc-image-modal" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
            <button type="button" className="kyc-close-button" onClick={() => setFullImage(null)}>Close</button>
            <div className="kyc-image-head">
              <strong>{fullImage.label}</strong>
            </div>
            <img src={fullImage.url} alt={fullImage.label} />
          </div>
        </div>
      ) : null}

      {rejectTarget ? (
        <div className="modal-overlay kyc-image-overlay" role="presentation" onClick={() => setRejectTarget(null)}>
          <div className="edit-modal kyc-reject-modal" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
            <button type="button" className="kyc-close-button" onClick={() => setRejectTarget(null)}>Close</button>
            <div className="modal-head kyc-modal-head">
              <div>
                <p className="eyebrow">Reject KYC</p>
                <h2>{rejectTarget.name}</h2>
                <span>Write a reason to reject this KYC. This reason will be visible to the partner.</span>
              </div>
            </div>
            <div className="kyc-reject-body">
              <label>
                Rejection reason
                <textarea
                  autoFocus
                  value={rejectReason}
                  onChange={event => setRejectReason(event.target.value)}
                  placeholder="Example: Driving license image is blurred. Please upload a clear photo."
                />
              </label>
              <div className="kyc-reject-actions">
                <button type="button" onClick={() => setRejectTarget(null)}>Cancel</button>
                <button
                  type="button"
                  disabled={!rejectReason.trim()}
                  onClick={() => {
                    onReviewKyc(rejectTarget, 'Rejected', rejectReason.trim());
                    setRejectTarget(null);
                    setRejectReason('');
                  }}
                >
                  Reject KYC
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
