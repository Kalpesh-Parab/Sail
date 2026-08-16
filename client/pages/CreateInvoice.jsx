// client/pages/CreateInvoice.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { State } from 'country-state-city';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import './CreateInvoice.scss';

// Relative components
import GoogleContactsPicker from '../components/GoogleContactsPicker';
import InvoicePrintTemplate from '../components/InvoicePrintTemplate';
import PartySection from './components/PartySection';
import InvoiceMetadataSection from './components/InvoiceMetadataSection';
import ItemsGridSection from './components/ItemsGridSection';
import InvoiceSummarySection from './components/InvoiceSummarySection';
import EditCompanyModal from './components/EditCompanyModal';

import { useGoogleContacts } from '../hooks/useGoogleContacts';

const INDIAN_STATES = State.getStatesOfCountry('IN').map((s) => s.name);

const CreateInvoice = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('editId');

  // Master state
  const [inventoryList, setInventoryList] = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState(null);

  // Form Fields
  const [customer, setCustomer] = useState({
    name: '',
    mobile: '',
    gstin: '',
    placeOfSupply: 'Maharashtra',
    shippingAddress: '',
  });

  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [paymentTerms, setPaymentTerms] = useState(30);
  const [amountReceived, setAmountReceived] = useState(0);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  // Line Items
  const [items, setItems] = useState([
    {
      inventoryId: '',
      productName: '',
      hsn: '',
      quantity: 1,
      availableStock: 0,
      sellingPrice: 0,
      grossPrice: 0,
      isGstIncluded: false,
      taxRate: 18,
      unit: 'PCS',
    },
  ]);

  const {
    contacts,
    loading: contactsLoading,
    syncContacts,
  } = useGoogleContacts();

  const handleSendWhatsAppPDF = async (invoiceId) => {
    setSendingWhatsApp(true);
    try {
      const res = await axios.post(`/api/invoices/${invoiceId}/send-whatsapp`);
      if (res.data.success) {
        alert('PDF Invoice sent to customer via WhatsApp!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send WhatsApp PDF');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleGoogleSync = () => {
    syncContacts();
    setIsContactsModalOpen(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = [
          axios.get('/api/inventory'),
          axios.get('/api/company-profile'),
        ];

        if (editId) {
          promises.push(axios.get(`/api/invoices/${editId}`));
        }

        const results = await Promise.allSettled(promises);

        let currentInvList = [];
        if (results[0].status === 'fulfilled') {
          const rawInv = results[0].value.data;
          currentInvList = Array.isArray(rawInv)
            ? rawInv
            : rawInv?.inventory || rawInv?.items || rawInv?.data || [];
          setInventoryList(currentInvList);
        }

        if (results[1].status === 'fulfilled') {
          const rawProfile = results[1].value.data;
          setCompanyProfile(rawProfile.profile || rawProfile || null);
        }

        if (editId && results[2]?.status === 'fulfilled') {
          const invData = results[2].value.data.invoice;
          if (invData) {
            setCustomer(invData.customer || {});
            setInvoiceDate(
              new Date(invData.invoiceDate).toISOString().split('T')[0],
            );
            setPaymentTerms(invData.paymentTerms || 30);
            setAmountReceived(invData.amountReceived || 0);

            const mappedItems = invData.items.map((it) => {
              const matchedInv = currentInvList.find(
                (inv) => inv._id === it.inventoryId,
              );
              const currentStock = matchedInv ? matchedInv.quantity : 0;
              const taxRate = it.taxRate || 18;
              const basePrice = it.sellingPrice || 0;
              const grossPrice =
                Math.round(basePrice * (1 + taxRate / 100) * 100) / 100;

              return {
                ...it,
                availableStock: currentStock + it.quantity,
                grossPrice,
                isGstIncluded: false,
              };
            });
            setItems(mappedItems);
          }
        }
      } catch (err) {
        console.error('Data loading error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [editId]);

  const handleSelectContact = (contact) => {
    setCustomer((prev) => ({
      ...prev,
      name: contact.name,
      mobile: contact.mobile,
      shippingAddress: contact.shippingAddress || prev.shippingAddress,
    }));
  };

  const handleItemSelect = (index, inventoryId) => {
    if (!inventoryId) return;

    const isAlreadyAdded = items.some(
      (it, i) => i !== index && it.inventoryId === inventoryId,
    );
    if (isAlreadyAdded) {
      alert('This product is already added. Adjust quantity instead.');
      return;
    }

    const selectedInv = inventoryList.find((inv) => inv._id === inventoryId);
    if (!selectedInv) return;

    const basePrice =
      selectedInv.sellingPrice ?? selectedInv.purchasePrice ?? 0;
    const taxRate = selectedInv.taxRate || 18;
    const grossPrice = Math.round(basePrice * (1 + taxRate / 100) * 100) / 100;

    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      inventoryId: selectedInv._id,
      productName: selectedInv.productName || selectedInv.name,
      hsn: selectedInv.hsn || '',
      availableStock: selectedInv.quantity,
      sellingPrice: basePrice,
      grossPrice: grossPrice,
      isGstIncluded: false,
      quantity: 1,
      taxRate: taxRate,
      unit: selectedInv.unit || 'PCS',
    };
    setItems(updatedItems);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    const item = { ...updatedItems[index] };
    const taxRate = Number(item.taxRate || 18);

    if (field === 'quantity') {
      item.quantity = Number(value);
    } else if (field === 'isGstIncluded') {
      item.isGstIncluded = Boolean(value);
      if (item.isGstIncluded) {
        item.grossPrice =
          Math.round(item.sellingPrice * (1 + taxRate / 100) * 100) / 100;
      } else {
        item.sellingPrice =
          Math.round((item.grossPrice / (1 + taxRate / 100)) * 10000) / 10000;
      }
    } else if (field === 'priceInput') {
      const rawVal = Math.max(0, Number(value) || 0);
      if (item.isGstIncluded) {
        item.grossPrice = rawVal;
        item.sellingPrice =
          Math.round((rawVal / (1 + taxRate / 100)) * 10000) / 10000;
      } else {
        item.sellingPrice = rawVal;
        item.grossPrice = Math.round(rawVal * (1 + taxRate / 100) * 100) / 100;
      }
    } else {
      item[field] = value;
    }

    updatedItems[index] = item;
    setItems(updatedItems);
  };

  const addLineItem = () => {
    setItems((prev) => [
      ...prev,
      {
        inventoryId: '',
        productName: '',
        hsn: '',
        quantity: 1,
        availableStock: 0,
        sellingPrice: 0,
        grossPrice: 0,
        isGstIncluded: false,
        taxRate: 18,
        unit: 'PCS',
      },
    ]);
  };

  const removeLineItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const isIntraState = customer.placeOfSupply === 'Maharashtra';

  const calculatedSummary = useMemo(() => {
    let taxableAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const formattedItems = items.map((item) => {
      const lineTaxable = (item.quantity || 0) * (item.sellingPrice || 0);
      taxableAmount += lineTaxable;

      let cgst = 0,
        sgst = 0,
        igst = 0;

      if (isIntraState) {
        cgst = Math.round(lineTaxable * 0.09 * 100) / 100;
        sgst = Math.round(lineTaxable * 0.09 * 100) / 100;
        totalCgst += cgst;
        totalSgst += sgst;
      } else {
        igst = Math.round(lineTaxable * 0.18 * 100) / 100;
        totalIgst += igst;
      }

      return {
        ...item,
        lineTaxable,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        amount: lineTaxable + cgst + sgst + igst,
      };
    });

    const rawTotal = taxableAmount + totalCgst + totalSgst + totalIgst;
    const totalAmount = Math.round(rawTotal);
    const roundOff = Math.round((totalAmount - rawTotal) * 100) / 100;

    return {
      taxableAmount,
      totalCgst,
      totalSgst,
      totalIgst,
      rawTotal,
      roundOff,
      totalAmount,
      balanceAmount: totalAmount - Number(amountReceived || 0),
      formattedItems,
    };
  }, [items, isIntraState, amountReceived]);

  const handleSubmitInvoice = async () => {
    if (!customer.name.trim()) {
      alert('Please enter or select a customer name.');
      return;
    }

    const hasInvalidItem = items.some(
      (it) => !it.inventoryId || it.quantity <= 0,
    );
    if (hasInvalidItem) {
      alert('Please select valid inventory items for all line items.');
      return;
    }

    const parsedReceived = parseFloat(amountReceived) || 0;
    const parsedTotal = calculatedSummary.totalAmount;
    const calculatedBalance = Math.max(0, parsedTotal - parsedReceived);

    const payload = {
      customer,
      invoiceDate,
      paymentTerms: Number(paymentTerms),
      taxableAmount: calculatedSummary.taxableAmount,
      totalCgst: calculatedSummary.totalCgst,
      totalSgst: calculatedSummary.totalSgst,
      totalIgst: calculatedSummary.totalIgst,
      roundOff: calculatedSummary.roundOff,
      totalAmount: parsedTotal,
      amountReceived: parsedReceived,
      balanceAmount: calculatedBalance,
      items: calculatedSummary.formattedItems,
    };

    try {
      let res;
      if (editId) {
        res = await axios.put(`/api/invoices/${editId}`, payload);
      } else {
        res = await axios.post('/api/invoices', payload);
      }

      if (res.data.success) {
        alert(
          editId
            ? 'Invoice Updated Successfully!'
            : 'Invoice Created Successfully!',
        );
        setCreatedInvoice(res.data.invoice);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving invoice');
    }
  };

  if (loading) {
    return <div className='loader-screen'>Loading System Data...</div>;
  }

  if (createdInvoice) {
    return (
      <div className='created-view-wrapper'>
        <div
          className='action-bar no-print'
          style={{ display: 'flex', gap: '10px' }}
        >
          <button
            className='btn-secondary'
            onClick={() => {
              setCreatedInvoice(null);
              if (editId) navigate('/invoice-history');
            }}
          >
            &larr;{' '}
            {editId ? 'Back to Invoice History' : 'Create Another Invoice'}
          </button>

          <button
            className='btn-whatsapp'
            style={{
              background: '#25D366',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
            disabled={sendingWhatsApp}
            onClick={() => handleSendWhatsAppPDF(createdInvoice._id)}
          >
            <FaWhatsapp style={{ fontSize: '18px' }} />
            {sendingWhatsApp ? 'Sending PDF...' : 'Send on WhatsApp'}
          </button>

          <button className='btn-primary' onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>

        <InvoicePrintTemplate
          invoice={createdInvoice}
          company={companyProfile}
        />
      </div>
    );
  }

  return (
    <div className='invoice-creator-container'>
      <div className='header-bar'>
        <h2>{editId ? 'Edit Invoice' : 'Create Sales Invoice'}</h2>
        <span className='subtitle'>
          {editId
            ? `Updating record #${editId}`
            : 'Shree Sai Tyres Billing Panel'}
        </span>
      </div>

      <div className='billbook-layout'>
        <PartySection
          customer={customer}
          setCustomer={setCustomer}
          indianStates={INDIAN_STATES}
          handleGoogleSync={handleGoogleSync}
        />
        <InvoiceMetadataSection
          invoiceDate={invoiceDate}
          setInvoiceDate={setInvoiceDate}
          paymentTerms={paymentTerms}
          setPaymentTerms={setPaymentTerms}
        />
      </div>

      {/* Reusable Item Grid Component */}
      <ItemsGridSection
        items={items}
        inventoryList={inventoryList}
        handleItemSelect={handleItemSelect}
        handleItemChange={handleItemChange}
        addLineItem={addLineItem}
        removeLineItem={removeLineItem}
      />

      <InvoiceSummarySection
        companyProfile={companyProfile}
        onOpenEditCompany={() => setIsCompanyModalOpen(true)}
        calculatedSummary={calculatedSummary}
        isIntraState={isIntraState}
        amountReceived={amountReceived}
        setAmountReceived={setAmountReceived}
        handleSubmitInvoice={handleSubmitInvoice}
      />

      {/* Modals */}
      <GoogleContactsPicker
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
        contacts={contacts}
        loading={contactsLoading}
        onSelectContact={handleSelectContact}
      />

      <EditCompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        companyProfile={companyProfile}
        onProfileUpdated={(updated) => setCompanyProfile(updated)}
      />
    </div>
  );
};

export default CreateInvoice;
