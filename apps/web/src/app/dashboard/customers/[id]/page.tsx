'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../lib/api';

interface Contact {
  id?: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
}

interface Customer {
  id: string;
  name: string;
  panNumber: string;
  isActive: boolean;
  contacts: Contact[];
}

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    loadCustomer();
  }, []);

  async function loadCustomer() {
    try {
      const customers = await api.get('/crm/customers');
        const invoiceData = await api.get('/sales/invoices');
const quotationData = await api.get('/sales/quotations');
const paymentData = await api.get('/sales/payments');

setInvoices(invoiceData);
setQuotations(quotationData);
setPayments(paymentData);
      console.log('Route ID:', customerId);
      console.log('Customers:', customers);

      const foundCustomer = customers.find(
        (c: Customer) => String(c.id) === String(customerId)
      );

      console.log('Found Customer:', foundCustomer);

      setCustomer(foundCustomer || null);
    } catch (error) {
      console.error('Failed to load customer:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h2>Loading customer...</h2>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <h2 className="text-red-500 font-bold">
          Customer not found
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Check browser console (F12) and see what customer IDs are returned.
        </p>
      </div>
    );
  }

  const customerInvoices = invoices.filter(
  (inv) => inv.customer?.name === customer?.name
);

const customerQuotations = quotations.filter(
  (q) => q.customer?.name === customer?.name
);

const customerPayments = payments.filter(
  (p) => p.invoice?.customer?.name === customer?.name
);

const totalRevenue = customerInvoices.reduce(
  (sum, inv) => sum + Number(inv.totalAmount || 0),
  0
);

const totalPaymentsReceived = customerPayments.reduce(
  (sum, p) => sum + Number(p.amount || 0),
  0
);

const outstandingAmount =
  totalRevenue - totalPaymentsReceived;


  return (
    <div className="p-6 space-y-6">
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h1 className="text-3xl font-bold">{customer.name}</h1>

        <p className="mt-2 text-gray-500">
          Customer ID: {customer.id}
        </p>

        <p className="mt-2">
          PAN Number: {customer.panNumber}
        </p>

        <span
          className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-medium ${
            customer.isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {customer.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <p className="text-sm text-gray-500">Quotations</p>
        <h2 className="text-2xl font-bold">
          {customerQuotations.length}
        </h2>
      </div>

      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <p className="text-sm text-gray-500">Invoices</p>
        <h2 className="text-2xl font-bold">
          {customerInvoices.length}
        </h2>
      </div>

      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <p className="text-sm text-gray-500">Payments</p>
        <h2 className="text-2xl font-bold">
          {customerPayments.length}
        </h2>
      </div>

      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <p className="text-sm text-gray-500">Revenue</p>
        <h2 className="text-2xl font-bold text-green-600">
          Rs. {totalRevenue.toLocaleString()}
        </h2>
      </div>
    </div>

<div className="bg-white border rounded-xl p-5 shadow-sm">
  <p className="text-sm text-gray-500">
    Amount Received
  </p>
  <h2 className="text-2xl font-bold text-green-600">
    Rs. {totalPaymentsReceived.toLocaleString()}
  </h2>
</div>
{/* Lead Information */}
<div className="bg-white border rounded-xl p-6 shadow-sm">
  <h2 className="text-xl font-bold mb-4">
    Lead Information
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <p className="text-sm text-gray-500">
        Lead Status
      </p>
      <p className="font-semibold">
        Converted
      </p>
    </div>

    <div>
      <p className="text-sm text-gray-500">
        Lead Source
      </p>
      <p className="font-semibold">
        Website
      </p>
    </div>

    <div>
      <p className="text-sm text-gray-500">
        Conversion Date
      </p>
      <p className="font-semibold">
        20-Jun-2026
      </p>
    </div>

    <div>
      <p className="text-sm text-gray-500">
        Assigned To
      </p>
      <p className="font-semibold">
        Sales Team
      </p>
    </div>
  </div>
</div>

{/* Activity Timeline */}
<div className="bg-white border rounded-xl p-6 shadow-sm">
  <h2 className="text-xl font-bold mb-4">
    Activity Timeline
  </h2>

  <div className="space-y-4">

    <div className="border-l-4 border-green-500 pl-4">
      <p className="font-semibold">
        Customer Created
      </p>
      <p className="text-sm text-gray-500">
        Customer profile registered.
      </p>
    </div>

    <div className="border-l-4 border-blue-500 pl-4">
      <p className="font-semibold">
        Lead Converted
      </p>
      <p className="text-sm text-gray-500">
        Lead converted into customer.
      </p>
    </div>

    <div className="border-l-4 border-orange-500 pl-4">
      <p className="font-semibold">
        Quotation Generated
      </p>
      <p className="text-sm text-gray-500">
        Customer quotation created.
      </p>
    </div>

    <div className="border-l-4 border-purple-500 pl-4">
      <p className="font-semibold">
        Invoice Generated
      </p>
      <p className="text-sm text-gray-500">
        Invoice issued to customer.
      </p>
    </div>

    <div className="border-l-4 border-green-600 pl-4">
      <p className="font-semibold">
        Payment Received
      </p>
      <p className="text-sm text-gray-500">
        Payment successfully received.
      </p>
    </div>

  </div>
</div>
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">
          Contact Directory
        </h2>

        {customer.contacts.length === 0 ? (
          <p>No contacts available.</p>
        ) : (
          <div className="space-y-3">
            {customer.contacts.map((contact, index) => (
              <div
                key={contact.id || index}
                className="border rounded-lg p-4"
              >
                <p>
                  <strong>Name:</strong> {contact.name}
                </p>

                <p>
                  <strong>Email:</strong>{' '}
                  {contact.email || 'N/A'}
                </p>

                <p>
                  <strong>Phone:</strong>{' '}
                  {contact.phone || 'N/A'}
                </p>

                <p>
                  <strong>Role:</strong>{' '}
                  {contact.role || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}