// client/hooks/useGoogleContacts.js
import { useState, useCallback } from 'react';
import axios from 'axios';

export const useGoogleContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  const syncContacts = useCallback(async () => {
    const cachedToken = localStorage.getItem('google_contacts_token');

    if (!cachedToken) {
      alert(
        'Google Contacts access token missing. Please sign out and sign in again.',
      );
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,addresses&pageSize=1000',
        {
          headers: {
            Authorization: `Bearer ${cachedToken}`,
          },
        },
      );

      const parsedContacts = (res.data.connections || []).map((person) => ({
        name: person.names?.[0]?.displayName || 'No Name',
        mobile: person.phoneNumbers?.[0]?.value || '',
        shippingAddress: person.addresses?.[0]?.formattedValue || '',
      }));

      setContacts(parsedContacts);
    } catch (err) {
      console.error('Failed to fetch Google contacts:', err);
      if (err.response?.status === 401) {
        alert(
          'Google Contacts session expired. Please sign out and sign in again.',
        );
        localStorage.removeItem('google_contacts_token');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { contacts, loading, syncContacts };
};
