/**
 * LEAD CREATE PAGE
 * 
 * Form for KAM to create a new lead from a dealer
 */

import { useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'sonner@2.0.3';
import { getDealerDTO } from '../../data/dtoSelectors';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../auth/AuthProvider';

interface LeadCreatePageProps {
  dealerId: string;
  onBack: () => void;
  onSuccess: (leadId: string) => void;
}

export function LeadCreatePage({ dealerId, onBack, onSuccess }: LeadCreatePageProps) {
  const { profile } = useAuth();
  const dealer = getDealerDTO(dealerId);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    channel: 'NGS' as 'NGS' | 'GS',
    customerName: '',
    customerPhone: '',
    carMake: '',
    carModel: '',
    year: new Date().getFullYear().toString(),
    variant: '',
    regNumber: '',
    kms: '',
    ownershipType: '1st Owner',
    fuelType: 'Petrol',
    transmission: 'Manual',
    expectedPrice: '',
    notes: '',
  });

  const handleSubmit = async () => {
    // Validation
    if (!formData.customerName || !formData.customerPhone) {
      toast.error('Please fill customer name and phone');
      return;
    }
    if (!formData.carMake || !formData.carModel) {
      toast.error('Please fill car make and model');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate lead ID
      const leadId = `C24-${dealer?.id.slice(-3)}${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;

      // Insert into Supabase leads_raw table

      const { error } = await supabase.from('leads_raw').insert({
        lead_id: leadId,
        dealer_id: dealerId,
        kam_id: profile?.id || '',
        channel: formData.channel,
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        car_make: formData.carMake,
        car_model: formData.carModel,
        year: formData.year,
        variant: formData.variant,
        reg_number: formData.regNumber,
        kms_driven: formData.kms,
        fuel_type: formData.fuelType,
        transmission: formData.transmission,
        expected_price: formData.expectedPrice,
        notes: formData.notes,
        status: 'New',
        created_at: new Date().toISOString(),
      });

      if (error) {
        toast.error('Failed to create lead: ' + error.message);
        setIsSubmitting(false);
        return;
      }

      toast.success('Lead created successfully!', {
        description: `Lead ID: ${leadId}`,
      });

      setIsSubmitting(false);
      onSuccess(leadId);
    } catch (err: any) {
      toast.error('Error creating lead: ' + (err.message || 'Unknown error'));
      setIsSubmitting(false);
    }
  };

  if (!dealer) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Dealer not found</p>
            <Button onClick={onBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg text-gray-900">Create Lead</h1>
              <p className="text-sm text-gray-600">{dealer.name} • {dealer.city}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Channel Selection */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Lead Channel</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['NGS', 'GS'] as const).map((channel) => (
              <button
                key={channel}
                onClick={() => setFormData({ ...formData, channel })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${formData.channel === channel
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {channel}
              </button>
            ))}
          </div>
        </Card>

        {/* Customer Details */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Customer Details</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Customer Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
        </Card>

        {/* Car Details */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Car Details</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Make <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.carMake}
                  onChange={(e) => setFormData({ ...formData, carMake: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Maruti"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.carModel}
                  onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Swift"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Year</label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="2020"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Variant</label>
                <input
                  type="text"
                  value={formData.variant}
                  onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="VXi"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Registration Number</label>
              <input
                type="text"
                value={formData.regNumber}
                onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="DL 01 AB 1234"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Kilometers</label>
                <input
                  type="text"
                  value={formData.kms}
                  onChange={(e) => setFormData({ ...formData, kms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="45000"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Ownership</label>
                <select
                  value={formData.ownershipType}
                  onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option>1st Owner</option>
                  <option>2nd Owner</option>
                  <option>3rd Owner</option>
                  <option>4th Owner+</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Fuel Type</label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option>Petrol</option>
                  <option>Diesel</option>
                  <option>CNG</option>
                  <option>Electric</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Transmission</label>
                <select
                  value={formData.transmission}
                  onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option>Manual</option>
                  <option>Automatic</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Expected Price (₹)</label>
              <input
                type="text"
                value={formData.expectedPrice}
                onChange={(e) => setFormData({ ...formData, expectedPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="500000"
              />
            </div>
          </div>
        </Card>

        {/* Additional Notes */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Additional Notes</h3>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={3}
            placeholder="Any additional information about the car or customer..."
          />
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t border-gray-200 p-4">
        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating Lead...' : 'Create Lead'}
        </Button>
      </div>
    </div>
  );
}