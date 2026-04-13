/**
 * LEAD CREATION FLOW
 *
 * Multi-step sheet that creates a lead via Cars24 APIs.
 * Steps: Lead Details → Car Details → Price Range → Submit → Status
 *
 * Entry points:
 *  1. Leads page "Create Lead" button → requires dealer selection
 *  2. Dealer detail page → dealer code pre-filled
 *
 * After lead accepted → offers "Book Appointment" flow
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  Loader2,
  Car,
  User,
  Search,
  MapPin,
  Calendar,
} from 'lucide-react';
import * as c24 from '../../lib/api/c24Api';
import { hasC24SessionToken } from '../../lib/api/c24Api';
import type {
  SelectOption,
  LeadFormValues,
  PriceRangeResponse,
} from '../../lib/api/c24Types';
import {
  KILOMETERS_OPTIONS,
  EMPTY_OPTION,
  getInitialLeadFormValues,
} from '../../lib/api/c24Types';
import { C24SessionSetup } from './C24SessionSetup';

// ============================================================================
// Props
// ============================================================================

interface LeadCreationFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-filled dealer code (from dealer detail page) */
  dealerCode?: string;
  /** Pre-filled dealer name (for display) */
  dealerName?: string;
  /** Called after lead is successfully created & accepted */
  onLeadCreated?: (leadId: string, dealerCode: string) => void;
  /** Called when user wants to book appointment after lead creation */
  onBookAppointment?: (leadId: string, dealerCode: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

const STEPS = [
  { key: 'lead-details', label: 'Lead Details', icon: User },
  { key: 'car-details', label: 'Car Details', icon: Car },
  { key: 'price-range', label: 'Price & Submit', icon: Search },
] as const;

const LEAD_TYPES: SelectOption[] = [
  { label: 'Seller Lead', value: 'seller' },
  { label: 'Inventory Lead', value: 'inventory' },
];

const FUEL_TYPES: SelectOption[] = [
  { label: 'Petrol', value: 'Petrol' },
  { label: 'Diesel', value: 'Diesel' },
  { label: 'CNG', value: 'CNG' },
  { label: 'Electric', value: 'Electric' },
];

const TRANSMISSIONS: SelectOption[] = [
  { label: 'Manual', value: 'MANUAL' },
  { label: 'Automatic', value: 'AUTOMATIC' },
];

const OWNERSHIPS: SelectOption[] = [
  { label: '1st Owner', value: '1' },
  { label: '2nd Owner', value: '2' },
  { label: '3rd Owner', value: '3' },
  { label: '4th Owner', value: '4' },
];

// ============================================================================
// Main Component
// ============================================================================

export function LeadCreationFlow({
  open,
  onOpenChange,
  dealerCode: initialDealerCode,
  dealerName: initialDealerName,
  onLeadCreated,
  onBookAppointment,
}: LeadCreationFlowProps) {
  // ── Session token ──
  const [isSessionConfigured, setIsSessionConfigured] = useState(hasC24SessionToken());

  // ── Step state ──
  const [step, setStep] = useState(0);
  const [leadStatus, setLeadStatus] = useState<'ACCEPTED' | 'DUPLICATE' | null>(null);
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);

  // ── Dealer ──
  const [dealerCode, setDealerCode] = useState(initialDealerCode || '');

  // ── Form values ──
  const [form, setForm] = useState<LeadFormValues>(getInitialLeadFormValues);

  // ── Price range ──
  const [priceRange, setPriceRange] = useState<PriceRangeResponse | null>(null);
  const [expectedPrice, setExpectedPrice] = useState('');

  // ── Loading states ──
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Dropdown data ──
  const [makes, setMakes] = useState<SelectOption[]>([]);
  const [years, setYears] = useState<SelectOption[]>([]);
  const [models, setModels] = useState<SelectOption[]>([]);
  const [variants, setVariants] = useState<SelectOption[]>([]);
  const [states, setStates] = useState<SelectOption[]>([]);
  const [cities, setCities] = useState<SelectOption[]>([]);
  const [rtoCodes, setRtoCodes] = useState<SelectOption[]>([]);

  // ── Update dealer code from props ──
  useEffect(() => {
    if (initialDealerCode) setDealerCode(initialDealerCode);
  }, [initialDealerCode]);

  // ── Reset on open/close ──
  useEffect(() => {
    if (open) {
      setIsSessionConfigured(hasC24SessionToken());
      setStep(0);
      setLeadStatus(null);
      setCreatedLeadId(null);
      setForm(getInitialLeadFormValues());
      setPriceRange(null);
      setExpectedPrice('');
      setDealerCode(initialDealerCode || '');
    }
  }, [open, initialDealerCode]);

  // ── Load makes, states, cities on mount ──
  useEffect(() => {
    if (!open || !isSessionConfigured) return;
    c24.getCarMakes().then((res) => {
      setMakes(
        (res.detail || []).map((m) => ({ label: m.make_display, value: m.make_id })),
      );
    }).catch((err) => {
      console.error('[LeadCreation] Failed to load car makes:', err);
      toast.error('Failed to load car brands. Check session token.');
    });
    c24.getStates().then((res) => {
      setStates(
        (res.detail || []).map((s) => ({ label: s.state_name, value: s.state_id })),
      );
    }).catch((err) => console.error('[LeadCreation] Failed to load states:', err));
    c24.getCities().then((res) => {
      setCities(
        (res.detail || []).map((c) => ({ label: c.city_name, value: c.city_id })),
      );
    }).catch((err) => console.error('[LeadCreation] Failed to load cities:', err));
  }, [open, isSessionConfigured]);

  // ── Load years when brand changes ──
  useEffect(() => {
    if (!form.brand.value) { setYears([]); return; }
    c24.getYears(Number(form.brand.value)).then((res) => {
      setYears((res.detail || []).map((y) => ({ label: y.year, value: y.year_id })));
    }).catch(() => setYears([]));
  }, [form.brand.value]);

  // ── Load models when brand+year change ──
  useEffect(() => {
    if (!form.brand.value || !form.year.value) { setModels([]); return; }
    c24.getModels(Number(form.brand.value), String(form.year.label || form.year.value)).then((res) => {
      setModels((res.detail || []).map((m) => ({ label: m.model_display, value: m.model_id })));
    }).catch(() => setModels([]));
  }, [form.brand.value, form.year.value]);

  // ── Load variants when model+year change ──
  useEffect(() => {
    if (!form.model.value || !form.year.value) { setVariants([]); return; }
    c24.getVariants(Number(form.model.value), String(form.year.label || form.year.value)).then((res) => {
      setVariants(c24.flattenVariants(res));
    }).catch(() => setVariants([]));
  }, [form.model.value, form.year.value]);

  // ── Load RTO codes when state changes ──
  useEffect(() => {
    if (!form.state.value) { setRtoCodes([]); return; }
    c24.getRTOCodes(Number(form.state.value)).then((res) => {
      setRtoCodes((res.detail || []).map((r) => ({ label: r.rto_code, value: r.rto_id })));
    }).catch(() => setRtoCodes([]));
  }, [form.state.value]);

  // ── Update a form field & clear dependents ──
  const setField = useCallback(
    (name: keyof LeadFormValues, value: SelectOption | string) => {
      setForm((prev) => {
        const next = { ...prev, [name]: value };
        // Cascading resets
        if (name === 'brand') {
          next.year = EMPTY_OPTION;
          next.model = EMPTY_OPTION;
          next.variant = EMPTY_OPTION;
        }
        if (name === 'year') {
          next.model = EMPTY_OPTION;
          next.variant = EMPTY_OPTION;
        }
        if (name === 'model') {
          next.variant = EMPTY_OPTION;
        }
        if (name === 'state') {
          next.rtoCode = EMPTY_OPTION;
        }
        return next;
      });
      // Clear price range when car details change
      if (['brand', 'year', 'model', 'variant', 'state', 'location', 'rtoCode', 'kilometers', 'fuelType', 'transmission', 'ownership'].includes(name)) {
        setPriceRange(null);
        setExpectedPrice('');
      }
    },
    [],
  );

  // ── Vehicle lookup by reg number ──
  const handleVehicleLookup = useCallback(async () => {
    if (!form.registrationNumber) return;
    setIsLookingUp(true);
    try {
      const res = await c24.lookupVehicle(form.registrationNumber);
      const d = res.detail;
      if (d) {
        setForm((prev) => ({
          ...prev,
          brand: d.brand ? { label: d.brand.make_display, value: d.brand.make_id } : prev.brand,
          year: d.year ? { label: d.year.year, value: d.year.year_id } : prev.year,
          model: d.model ? { label: d.model.model_display, value: d.model.model_id } : prev.model,
          variant: d.ds_details?.[0]?.variant
            ? { label: d.ds_details[0].variant.variant_display_name, value: d.ds_details[0].variant.variant_id }
            : prev.variant,
          rtoCode: d.RTO ? { label: d.RTO.rto_code, value: d.RTO.rto_detail_id } : prev.rtoCode,
          fuelType: d.fuelType ? { label: d.fuelType, value: d.fuelType } : prev.fuelType,
          state: d.states ? { label: d.states.state_name, value: d.states.state_id } : prev.state,
          transmission: d.ds_details?.[0]?.variant?.transmission_type
            ? {
                label: d.ds_details[0].variant.transmission_type === 'AT' ? 'Automatic' : 'Manual',
                value: d.ds_details[0].variant.transmission_type === 'AT' ? 'AUTOMATIC' : 'MANUAL',
              }
            : prev.transmission,
        }));
        toast.success('Car details auto-filled from registration number');
      }
    } catch {
      toast.error('Could not look up vehicle. Please fill details manually.');
    }
    setIsLookingUp(false);
  }, [form.registrationNumber]);

  // ── Build price range / create lead payloads ──
  const buildPayload = useCallback(() => ({
    cxNumber: form.ownerPhoneNumber,
    cxRegNo: form.registrationNumber,
    cxName: form.ownerName,
    makeId: Number(form.brand.value),
    make: form.brand.label,
    modelId: Number(form.model.value),
    model: form.model.label,
    variantId: Number(form.variant.value),
    variant: form.variant.label,
    year: String(form.year.label || form.year.value),
    yearId: Number(form.year.value),
    stateId: Number(form.state.value),
    state: form.state.label.toUpperCase(),
    city: form.location.label.toUpperCase(),
    cityId: Number(form.location.value),
    rtoId: Number(form.rtoCode.value),
    rtoCode: form.rtoCode.label,
    transmission: String(form.transmission.value),
    kmsDriven: String(form.kilometers.value),
    fuelType: String(form.fuelType.value),
    ownership: String(form.ownership.value),
    leadType: String(form.leadType.value),
  }), [form]);

  // ── Get price range ──
  const handleGetPriceRange = useCallback(async () => {
    if (!dealerCode) { toast.error('Please enter dealer code'); return; }
    setIsFetchingPrice(true);
    try {
      const res = await c24.estimatePrice(dealerCode, buildPayload());
      setPriceRange(res);
      if (res.estimatedPrice) {
        toast.success(`Price range: ₹${res.estimatedPrice.min.toLocaleString('en-IN')} - ₹${res.estimatedPrice.max.toLocaleString('en-IN')}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to get price range');
    }
    setIsFetchingPrice(false);
  }, [dealerCode, buildPayload]);

  // ── Submit lead ──
  const handleSubmitLead = useCallback(async () => {
    if (!dealerCode) return;
    setIsSubmitting(true);
    try {
      const payload = { ...buildPayload(), dealerExpectedPrice: expectedPrice };
      const res = await c24.createLead(dealerCode, payload);
      setLeadStatus(res.leadStatus);
      if (res.leadId) setCreatedLeadId(res.leadId);
      if (res.leadStatus === 'ACCEPTED') {
        toast.success('Lead created successfully!');
        onLeadCreated?.(res.leadId || '', dealerCode);
      } else {
        toast.error('Lead already exists (duplicate)');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create lead');
    }
    setIsSubmitting(false);
  }, [dealerCode, buildPayload, expectedPrice, onLeadCreated]);

  // ── Validation ──
  const isStep0Valid = useMemo(() => {
    return (
      !!form.leadType.value &&
      !!form.registrationNumber &&
      /^[6-9]\d{9}$/.test(form.ownerPhoneNumber) &&
      /^[a-zA-Z\s]{3,30}$/.test(form.ownerName) &&
      !!dealerCode
    );
  }, [form.leadType, form.registrationNumber, form.ownerPhoneNumber, form.ownerName, dealerCode]);

  const isStep1Valid = useMemo(() => {
    return (
      !!form.brand.value &&
      !!form.year.value &&
      !!form.model.value &&
      !!form.variant.value &&
      !!form.state.value &&
      !!form.location.value &&
      !!form.rtoCode.value &&
      !!form.kilometers.value &&
      !!form.fuelType.value &&
      !!form.transmission.value &&
      !!form.ownership.value
    );
  }, [form]);

  const isPriceValid = useMemo(() => {
    if (!priceRange?.estimatedPrice || !expectedPrice) return false;
    const price = Number(expectedPrice);
    return price >= priceRange.estimatedPrice.min && price <= priceRange.estimatedPrice.max;
  }, [priceRange, expectedPrice]);

  // ── Render helpers ──
  const renderSelect = (
    name: keyof LeadFormValues,
    label: string,
    options: SelectOption[],
    placeholder = 'Select...',
  ) => {
    const value = form[name] as SelectOption;
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{label} <span className="text-red-500">*</span></Label>
        <Select
          value={value.value ? String(value.value) : undefined}
          onValueChange={(v) => {
            const opt = options.find((o) => String(o.value) === v);
            if (opt) setField(name, opt);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {options.map((o) => (
              <SelectItem key={String(o.value)} value={String(o.value)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderPillGroup = (
    name: keyof LeadFormValues,
    label: string,
    options: SelectOption[],
  ) => {
    const value = form[name] as SelectOption;
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label} <span className="text-red-500">*</span></Label>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => setField(name, o)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                String(value.value) === String(o.value)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── STEP 0: Lead Details ──
  const renderLeadDetails = () => (
    <div className="space-y-4 p-1">
      {/* Dealer Code (if not pre-filled) */}
      {!initialDealerCode && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Dealer Code <span className="text-red-500">*</span></Label>
          <Input
            value={dealerCode}
            onChange={(e) => setDealerCode(e.target.value)}
            placeholder="Enter dealer code"
          />
        </div>
      )}

      {initialDealerCode && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Dealer:</span> {initialDealerName || initialDealerCode}
            <span className="ml-2 text-blue-600">({initialDealerCode})</span>
          </p>
        </Card>
      )}

      {renderSelect('leadType', 'Lead Type', LEAD_TYPES, 'Select lead type')}

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Registration Number <span className="text-red-500">*</span></Label>
        <div className="flex gap-2">
          <Input
            value={form.registrationNumber}
            onChange={(e) => setField('registrationNumber', e.target.value.toUpperCase())}
            placeholder="DL01AB1234"
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleVehicleLookup}
            disabled={!form.registrationNumber || isLookingUp}
            className="shrink-0"
          >
            {isLookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="ml-1.5">Lookup</span>
          </Button>
        </div>
        <p className="text-xs text-gray-500">Enter reg number and click Lookup to auto-fill car details</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Owner Phone Number <span className="text-red-500">*</span></Label>
        <Input
          type="tel"
          value={form.ownerPhoneNumber}
          onChange={(e) => setField('ownerPhoneNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="9876543210"
          maxLength={10}
        />
        {form.ownerPhoneNumber && !/^[6-9]\d{9}$/.test(form.ownerPhoneNumber) && (
          <p className="text-xs text-red-500">Must be a valid 10-digit Indian mobile number</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Car Owner Name <span className="text-red-500">*</span></Label>
        <Input
          value={form.ownerName}
          onChange={(e) => setField('ownerName', e.target.value)}
          placeholder="Enter owner name"
        />
        {form.ownerName && !/^[a-zA-Z\s]{3,30}$/.test(form.ownerName) && (
          <p className="text-xs text-red-500">Letters and spaces only, 3-30 characters</p>
        )}
      </div>
    </div>
  );

  // ── STEP 1: Car Details ──
  const renderCarDetails = () => (
    <div className="space-y-4 p-1">
      <div className="grid grid-cols-2 gap-3">
        {renderSelect('brand', 'Brand', makes, 'Select brand')}
        {renderSelect('year', 'Year', years, form.brand.value ? 'Select year' : 'Select brand first')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {renderSelect('model', 'Model', models, form.year.value ? 'Select model' : 'Select year first')}
        {renderSelect('variant', 'Variant', variants, form.model.value ? 'Select variant' : 'Select model first')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {renderSelect('state', 'State', states, 'Select state')}
        {renderSelect('rtoCode', 'RTO Code', rtoCodes, form.state.value ? 'Select RTO' : 'Select state first')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {renderSelect('location', 'Car Location', cities, 'Select city')}
        {renderSelect('kilometers', 'Kilometers Driven', KILOMETERS_OPTIONS, 'Select range')}
      </div>

      <div className="border-t pt-4 space-y-4">
        {renderPillGroup('fuelType', 'Fuel Type', FUEL_TYPES)}
        {renderPillGroup('transmission', 'Transmission', TRANSMISSIONS)}
        {renderPillGroup('ownership', 'Ownership', OWNERSHIPS)}
      </div>
    </div>
  );

  // ── STEP 2: Price Range & Submit ──
  const renderPriceRange = () => (
    <div className="space-y-4 p-1">
      {/* Summary Card */}
      <Card className="p-4 bg-gray-50">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Lead Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">Dealer:</span> <span className="font-medium">{dealerCode}</span></div>
          <div><span className="text-gray-500">Type:</span> <span className="font-medium">{form.leadType.label}</span></div>
          <div><span className="text-gray-500">Owner:</span> <span className="font-medium">{form.ownerName}</span></div>
          <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{form.ownerPhoneNumber}</span></div>
          <div className="col-span-2"><span className="text-gray-500">Car:</span> <span className="font-medium">{form.brand.label} {form.model.label} {form.year.label} {form.variant.label}</span></div>
          <div><span className="text-gray-500">Reg:</span> <span className="font-medium">{form.registrationNumber}</span></div>
          <div><span className="text-gray-500">Fuel:</span> <span className="font-medium">{form.fuelType.label}</span></div>
        </div>
      </Card>

      {/* Price Range Section */}
      {!priceRange ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-600 mb-4">Get the estimated price range for this car</p>
          <Button
            onClick={handleGetPriceRange}
            disabled={isFetchingPrice}
            className="w-full"
          >
            {isFetchingPrice && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Get Price Range
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {priceRange.estimatedPrice && (
            <Card className="p-4 bg-green-50 border-green-200">
              <h4 className="text-sm font-semibold text-green-800 mb-1">Estimated Price Range</h4>
              <p className="text-lg font-bold text-green-900">
                ₹{priceRange.estimatedPrice.min.toLocaleString('en-IN')} — ₹{priceRange.estimatedPrice.max.toLocaleString('en-IN')}
              </p>
            </Card>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Customer Expected Price <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              value={expectedPrice}
              onChange={(e) => setExpectedPrice(e.target.value)}
              placeholder="Enter expected price"
            />
            {priceRange.estimatedPrice && expectedPrice && !isPriceValid && (
              <p className="text-xs text-amber-600">
                Price must be between ₹{priceRange.estimatedPrice.min.toLocaleString('en-IN')} and ₹{priceRange.estimatedPrice.max.toLocaleString('en-IN')}
              </p>
            )}
            {isPriceValid && (
              <p className="text-xs text-green-600">Price is within acceptable range</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // ── RESULT: Lead Status ──
  const renderLeadStatus = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      {leadStatus === 'ACCEPTED' ? (
        <>
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Lead Submitted Successfully!</h3>
          <p className="text-sm text-gray-600 text-center">
            The lead has been created and accepted.
            {createdLeadId && <span className="block mt-1 text-gray-500">Lead ID: {createdLeadId}</span>}
          </p>
          {onBookAppointment && createdLeadId && (
            <Button
              className="mt-4 w-full"
              onClick={() => {
                onOpenChange(false);
                onBookAppointment(createdLeadId, dealerCode);
              }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          )}
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Oops! Lead Already Exists</h3>
          <p className="text-sm text-gray-600 text-center">
            A lead with this registration number already exists in the system.
          </p>
        </>
      )}
    </div>
  );

  // ── Footer buttons ──
  const renderFooter = () => {
    if (leadStatus) {
      return (
        <SheetFooter className="border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </SheetFooter>
      );
    }

    return (
      <SheetFooter className="border-t flex-row gap-2">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        )}
        {step < 2 && (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={step === 0 ? !isStep0Valid : !isStep1Valid}
            className="flex-1"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
        {step === 2 && priceRange && (
          <Button
            onClick={handleSubmitLead}
            disabled={!isPriceValid || isSubmitting}
            className="flex-1"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Lead
          </Button>
        )}
      </SheetFooter>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Create Lead</SheetTitle>
          <SheetDescription>
            {initialDealerName
              ? `Creating lead for ${initialDealerName}`
              : 'Create a new sell lead with appointment booking'}
          </SheetDescription>

          {/* Step indicator */}
          {!leadStatus && (
            <div className="flex items-center gap-1 mt-2">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex items-center flex-1">
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors w-full justify-center ${
                      i === step
                        ? 'bg-blue-100 text-blue-700'
                        : i < step
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {i < step ? <Check className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-4 h-0.5 mx-0.5 ${i < step ? 'bg-green-300' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </SheetHeader>

        {/* Session token gate */}
        {!isSessionConfigured ? (
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            <C24SessionSetup onConfigured={() => setIsSessionConfigured(true)} />
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              To create leads, you need a valid Cars24 KAM panel session token.
              Log into the KAM panel in your browser, then copy the session token
              from Developer Tools → Application → Cookies → <code className="bg-gray-100 px-1 rounded">session_token</code>.
            </p>
          </div>
        ) : (
          <>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4">
              {leadStatus
                ? renderLeadStatus()
                : step === 0
                ? renderLeadDetails()
                : step === 1
                ? renderCarDetails()
                : renderPriceRange()}
            </div>

            {renderFooter()}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
