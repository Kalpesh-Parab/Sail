// client/components/create-invoice/EditCompanyModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditCompanyModal = ({
  isOpen,
  onClose,
  companyProfile,
  onProfileUpdated,
}) => {
  const [formData, setFormData] = useState({
    businessName: '',
    gstin: '',
    mobile: '',
    address: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (companyProfile) {
      setFormData({
        businessName: companyProfile.businessName || '',
        gstin: companyProfile.gstin || '',
        mobile: companyProfile.mobile || '',
        address: companyProfile.address || '',
        bankDetails: {
          accountName: companyProfile.bankDetails?.accountName || '',
          accountNumber: companyProfile.bankDetails?.accountNumber || '',
          ifscCode: companyProfile.bankDetails?.ifscCode || '',
          bankName: companyProfile.bankDetails?.bankName || '',
        },
      });
    }
  }, [companyProfile]);

  if (!isOpen) return null;

  const handleBankChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.put('/api/company-profile', formData);
      if (res.data.success) {
        onProfileUpdated(res.data.profile);
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update company profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='modal-backdrop'>
      <div className='modal-card'>
        <div className='modal-header'>
          <h3>Edit Company Details</h3>
          <button className='btn-close' onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className='modal-body'>
          <div className='form-group'>
            <label>Business Name</label>
            <input
              type='text'
              value={formData.businessName}
              onChange={(e) =>
                setFormData({ ...formData, businessName: e.target.value })
              }
              required
            />
          </div>

          <div className='form-row'>
            <div className='form-group col-6'>
              <label>GSTIN</label>
              <input
                type='text'
                value={formData.gstin}
                onChange={(e) =>
                  setFormData({ ...formData, gstin: e.target.value })
                }
              />
            </div>
            <div className='form-group col-6'>
              <label>Mobile Number</label>
              <input
                type='text'
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
              />
            </div>
          </div>

          <hr />
          <h4>Bank Details</h4>

          <div className='form-row'>
            <div className='form-group col-6'>
              <label>Bank Name</label>
              <input
                type='text'
                placeholder='e.g. Bank of Maharashtra'
                value={formData.bankDetails.bankName}
                onChange={(e) => handleBankChange('bankName', e.target.value)}
              />
            </div>
            <div className='form-group col-6'>
              <label>Account Number</label>
              <input
                type='text'
                value={formData.bankDetails.accountNumber}
                onChange={(e) =>
                  handleBankChange('accountNumber', e.target.value)
                }
              />
            </div>
          </div>

          <div className='form-row'>
            <div className='form-group col-6'>
              <label>IFSC Code</label>
              <input
                type='text'
                value={formData.bankDetails.ifscCode}
                onChange={(e) => handleBankChange('ifscCode', e.target.value)}
              />
            </div>
            <div className='form-group col-6'>
              <label>Account Holder Name</label>
              <input
                type='text'
                value={formData.bankDetails.accountName}
                onChange={(e) =>
                  handleBankChange('accountName', e.target.value)
                }
              />
            </div>
          </div>

          <div className='modal-actions'>
            <button type='button' className='btn-secondary' onClick={onClose}>
              Cancel
            </button>
            <button type='submit' className='btn-primary' disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCompanyModal;
