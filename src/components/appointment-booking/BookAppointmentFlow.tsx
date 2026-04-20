/**
 * APPOINTMENT BOOKING FLOW
 *
 * Multi-step sheet for booking/rescheduling an inspection appointment.
 * Steps: Search Location → Select Store/Zone & Slot → OTP Verification → Confirmation
 *
 * Called after lead is created and accepted, or from lead detail "Book Appointment".
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
import { Card } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { toast } from 'sonner';
import {
  MapPin,
  Clock,
  Check,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Home,
  Building,
  Sun,
  Sunset,
  Moon,
  Search,
} from 'lucide-react';
import * as c24 from '../../lib/api/c24Api';
import type {
  LocationGeometry,
  SelectedSlot,
  TransformedSlot,
  StoreOption,
  StoreInfo,
} from '../../lib/api/c24Types';

// ============================================================================
// Props
// ============================================================================

interface BookAppointmentFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  dealerCode: string;
  isReschedule?: boolean;
  onComplete?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function transformStoreSlots(store: StoreInfo): TransformedSlot[] {
  if (!store.date_slot) return [];
  return Object.values(store.date_slot).map((ds) => ({
    date: ds.date,
    time: {
      morning: Object.entries(ds.time?.Morning || {}).map(([hour, slot]) => ({
        time: slot.time,
        hour,
        timeRange: slot.time_range,
      })),
      afternoon: Object.entries(ds.time?.Afternoon || {}).map(([hour, slot]) => ({
        time: slot.time,
        hour,
        timeRange: slot.time_range,
      })),
      evening: Object.entries(ds.time?.Evening || {}).map(([hour, slot]) => ({
        time: slot.time,
        hour,
        timeRange: slot.time_range,
      })),
    },
  }));
}

const TIME_SECTIONS = [
  { key: 'morning' as const, label: 'Morning', icon: Sun },
  { key: 'afternoon' as const, label: 'Afternoon', icon: Sunset },
  { key: 'evening' as const, label: 'Evening', icon: Moon },
];

// ============================================================================
// Main Component
// ============================================================================

export function BookAppointmentFlow({
  open,
  onOpenChange,
  leadId,
  dealerCode,
  isReschedule = false,
  onComplete,
}: BookAppointmentFlowProps) {
  // ── Step state ──
  const [step, setStep] = useState(0); // 0: search, 1: slots, 2: confirmation
  const [isBooked, setIsBooked] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [bookingError, setBookingError] = useState(false);

  // ── Location ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    mainText: string;
    secondaryText: string;
    latitude: number;
    longitude: number;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentGeometry, setCurrentGeometry] = useState<LocationGeometry | null>(null);

  // ── Slots ──
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [homeInspectionStore, setHomeInspectionStore] = useState<StoreOption | null>(null);
  const [isHomeInspection, setIsHomeInspection] = useState(false);
  const [selectedStoreIdx, setSelectedStoreIdx] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [userDetails, setUserDetails] = useState<{ userName: string; phoneNumber: string }>({ userName: '', phoneNumber: '' });
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  // ── Home inspection address ──
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');

  // ── Booking ──
  const [isBooking, setIsBooking] = useState(false);

  // ── OTP ──
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // ── Reset on open ──
  useEffect(() => {
    if (open) {
      setStep(0);
      setIsBooked(false);
      setIsOtpVerified(false);
      setBookingError(false);
      setSearchQuery('');
      setSearchResults([]);
      setCurrentGeometry(null);
      setStores([]);
      setHomeInspectionStore(null);
      setIsHomeInspection(false);
      setSelectedStoreIdx(0);
      setSelectedSlot(null);
      setAddress1('');
      setAddress2('');
      setOtp('');
    }
  }, [open]);

  // ── Location Search (debounced) ──
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await c24.searchLocation(searchQuery);
        setSearchResults(
          results.map((r) => ({
            mainText: r.structured_formatting.main_text,
            secondaryText: r.structured_formatting.secondary_text,
            latitude: r.geometry.location.lat,
            longitude: r.geometry.location.lng,
          })),
        );
      } catch {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Select location result ──
  const handleSelectLocation = useCallback(async (result: typeof searchResults[0]) => {
    const geo = await c24.reverseGeocode(result.latitude, result.longitude);
    const pincode = geo?.address_components?.find((c) => c.types.includes('postal_code'))?.long_name;
    setCurrentGeometry({
      latitude: result.latitude,
      longitude: result.longitude,
      place: geo?.formatted_address || result.secondaryText,
      pincode,
    });
    setSearchQuery('');
    setSearchResults([]);
    // Auto-advance to slots
    setStep(1);
    fetchSlots(result.latitude, result.longitude);
  }, [leadId, dealerCode]);

  // ── Fetch slots ──
  const fetchSlots = useCallback(async (lat: number, lng: number) => {
    setIsFetchingSlots(true);
    try {
      const res = await c24.getSlots(leadId, dealerCode, lat, lng);
      const slotsData = res.slotsAndStoresDetails;
      const zoneLocationId = slotsData.zone?.location_id;

      // Build store options
      const storeOptions: StoreOption[] = [];
      let homeStore: StoreOption | null = null;

      for (const [locId, storeInfo] of Object.entries(slotsData.slots || {})) {
        const option: StoreOption = {
          locationId: storeInfo.location_id,
          locationName: storeInfo.location_name,
          cityId: storeInfo.city_id,
          address: storeInfo.address_detail
            ? `${storeInfo.address_detail.address1}, ${storeInfo.address_detail.address2}`
            : '',
          slots: transformStoreSlots(storeInfo),
        };

        if (locId === zoneLocationId) {
          homeStore = option;
          if (slotsData.zone) {
            homeStore.locationId = slotsData.zone.location_id;
          }
        } else {
          storeOptions.push(option);
        }
      }

      setStores(storeOptions);
      setHomeInspectionStore(homeStore);
      setUserDetails({
        userName: res.attributes?.leadDetails?.cxName || '',
        phoneNumber: res.attributes?.leadDetails?.cxNumber || '',
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch appointment slots');
    }
    setIsFetchingSlots(false);
  }, [leadId, dealerCode]);

  // ── Current store ──
  const currentStore = useMemo(() => {
    if (isHomeInspection) return homeInspectionStore;
    return stores[selectedStoreIdx] || null;
  }, [isHomeInspection, homeInspectionStore, stores, selectedStoreIdx]);

  // ── Book appointment ──
  const handleBook = useCallback(async () => {
    if (!currentStore || !selectedSlot?.hour || !currentGeometry) return;
    setIsBooking(true);
    setBookingError(false);
    try {
      const payload = {
        appointment: {
          fullName: userDetails.userName,
          location: currentStore.locationId,
          phone: userDetails.phoneNumber,
          date: selectedSlot.date,
          time: selectedSlot.hour,
          rescheduleSource: 'dealer-referrals',
          ...(isHomeInspection
            ? { zoneId: homeInspectionStore?.locationId }
            : { cityId: currentStore.cityId }),
        },
        appointmentGeo: {
          userLat: currentGeometry.latitude,
          userLng: currentGeometry.longitude,
          addressType: 'address',
          appointmentAddress: currentGeometry.place,
          ...(isHomeInspection ? { address1, address2 } : {}),
        },
      };

      if (isReschedule) {
        await c24.rescheduleAppointment(leadId, dealerCode, payload);
        setIsBooked(true);
        setIsOtpVerified(true); // Reschedule skips OTP
        setStep(2);
        toast.success('Appointment rescheduled successfully!');
      } else {
        await c24.bookAppointment(leadId, dealerCode, payload);
        setIsBooked(true);
        // Send OTP
        sendOtp();
      }
    } catch (err: any) {
      setBookingError(true);
      toast.error(err.message || 'Failed to book appointment');
    }
    setIsBooking(false);
  }, [currentStore, selectedSlot, currentGeometry, userDetails, isHomeInspection, homeInspectionStore, address1, address2, leadId, dealerCode, isReschedule]);

  // ── Send OTP ──
  const sendOtp = useCallback(async () => {
    setIsSendingOtp(true);
    try {
      await c24.sendAppointmentOtp(leadId, dealerCode);
      setShowOtpModal(true);
    } catch {
      toast.error('Failed to send OTP. Please try again.');
    }
    setIsSendingOtp(false);
  }, [leadId, dealerCode]);

  // ── Verify OTP ──
  const handleVerifyOtp = useCallback(async () => {
    if (otp.length < 4) return;
    setIsVerifyingOtp(true);
    try {
      await c24.verifyAppointmentOtp(leadId, dealerCode, { otp });
      setIsOtpVerified(true);
      setShowOtpModal(false);
      setStep(2);
      toast.success('OTP verified! Appointment confirmed.');
    } catch {
      toast.error('Invalid OTP. Please try again.');
    }
    setIsVerifyingOtp(false);
  }, [otp, leadId, dealerCode]);

  // ── Can book? ──
  const canBook = useMemo(() => {
    if (!selectedSlot?.hour) return false;
    if (isHomeInspection && (!address1 || !address2)) return false;
    return true;
  }, [selectedSlot, isHomeInspection, address1, address2]);

  // ══════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════

  // ── Step 0: Location Search ──
  const renderLocationSearch = () => (
    <div className="space-y-4 p-1">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Search for inspection location</Label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search area, locality, or address..."
            className="pl-9"
          />
        </div>
      </div>

      {isSearching && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {searchResults.map((r, i) => (
            <button
              key={i}
              onClick={() => handleSelectLocation(r)}
              className="w-full text-left p-3 rounded-lg border hover:bg-blue-50 hover:border-blue-200 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900">{r.mainText}</p>
              <p className="text-xs text-gray-500 mt-0.5">{r.secondaryText}</p>
            </button>
          ))}
        </div>
      )}

      {currentGeometry && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">{currentGeometry.place}</p>
              {currentGeometry.pincode && (
                <p className="text-xs text-blue-600">PIN: {currentGeometry.pincode}</p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  // ── Step 1: Slots ──
  const renderSlots = () => {
    if (isFetchingSlots) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-gray-500">Loading available slots...</p>
        </div>
      );
    }

    // Selected date's time slots
    const selectedDateSlots = currentStore?.slots?.find((s) => s.date === selectedSlot?.date);

    return (
      <div className="space-y-4 p-1">
        {/* Location summary */}
        {currentGeometry && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="truncate max-w-[250px]">{currentGeometry.place}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep(0);
                setStores([]);
                setSelectedSlot(null);
                setIsHomeInspection(false);
              }}
            >
              Change
            </Button>
          </div>
        )}

        {/* Store / Home inspection toggle */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Inspection Type</Label>
          <div className="flex gap-2">
            <button
              onClick={() => { setIsHomeInspection(false); setSelectedSlot(null); }}
              className={`flex-1 flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                !isHomeInspection ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Building className="w-4 h-4" />
              Store Visit
            </button>
            {homeInspectionStore && (
              <button
                onClick={() => { setIsHomeInspection(true); setSelectedSlot(null); setSelectedStoreIdx(0); }}
                className={`flex-1 flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  isHomeInspection ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Home className="w-4 h-4" />
                Home Inspection
              </button>
            )}
          </div>
        </div>

        {/* Store selection (if store visit) */}
        {!isHomeInspection && stores.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Store</Label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {stores.map((store, idx) => (
                <button
                  key={store.locationId}
                  onClick={() => { setSelectedStoreIdx(idx); setSelectedSlot(null); }}
                  className={`shrink-0 p-3 rounded-lg border text-left min-w-[180px] transition-colors ${
                    selectedStoreIdx === idx
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{store.locationName}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{store.address}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Home inspection address fields */}
        {isHomeInspection && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Flat/House No/Building <span className="text-red-500">*</span></Label>
              <Input
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                placeholder="e.g., Flat 302, Tower A, Prestige Lakeside"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Locality/Landmark <span className="text-red-500">*</span></Label>
              <Input
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                placeholder="e.g., Near City Mall, Whitefield"
              />
            </div>
          </div>
        )}

        {/* Date selector */}
        {currentStore && currentStore.slots.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Date</Label>
            <Select
              value={selectedSlot?.date || undefined}
              onValueChange={(v) => setSelectedSlot({ date: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a date" />
              </SelectTrigger>
              <SelectContent>
                {currentStore.slots.map((s) => (
                  <SelectItem key={s.date} value={s.date}>
                    {new Date(s.date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Time slots */}
        {selectedDateSlots && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Time</Label>
            {TIME_SECTIONS.map(({ key, label, icon: Icon }) => {
              const slots = selectedDateSlots.time[key];
              if (!slots || slots.length === 0) return null;
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium uppercase">
                    <Icon className="w-3 h-3" />
                    {label}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.hour}
                        onClick={() =>
                          setSelectedSlot((prev) => ({
                            ...prev!,
                            time: key,
                            hour: slot.hour,
                            timeRange: slot.timeRange,
                          }))
                        }
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                          selectedSlot?.hour === slot.hour
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {slot.timeRange}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {stores.length === 0 && !isFetchingSlots && !homeInspectionStore && (
          <div className="text-center py-8">
            <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No stores found near this location</p>
          </div>
        )}
      </div>
    );
  };

  // ── Step 2: Confirmation ──
  const renderConfirmation = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      {bookingError ? (
        <>
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Something Went Wrong</h3>
          <p className="text-sm text-gray-600 text-center">
            Appointment was not scheduled. Please try again.
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isReschedule ? 'Appointment Rescheduled!' : 'Appointment Confirmed!'}
          </h3>
          {selectedSlot && (
            <Card className="p-4 bg-gray-50 w-full max-w-xs">
              <div className="space-y-1 text-sm text-center">
                <p className="font-medium text-gray-900">
                  {new Date(selectedSlot.date).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
                {selectedSlot.timeRange && (
                  <p className="text-gray-600">{selectedSlot.timeRange}</p>
                )}
                {currentStore && (
                  <p className="text-gray-500 text-xs mt-2">
                    {isHomeInspection ? 'Home Inspection' : currentStore.locationName}
                  </p>
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );

  // ── OTP Modal ──
  const renderOtpModal = () => (
    <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Verify OTP</DialogTitle>
          <DialogDescription>
            Enter the 4-digit OTP sent to the customer's phone number
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <InputOTP maxLength={4} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setShowOtpModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleVerifyOtp}
            disabled={otp.length < 4 || isVerifyingOtp}
          >
            {isVerifyingOtp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Verify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ── Footer ──
  const renderFooter = () => {
    // Confirmation step
    if (step === 2) {
      return (
        <SheetFooter className="border-t">
          <Button
            onClick={() => {
              onOpenChange(false);
              onComplete?.();
            }}
            className="w-full"
          >
            {bookingError ? 'Close' : 'Continue'}
          </Button>
          {bookingError && (
            <Button
              variant="outline"
              onClick={() => {
                setStep(0);
                setBookingError(false);
                setIsBooked(false);
                setSelectedSlot(null);
              }}
              className="w-full"
            >
              Retry
            </Button>
          )}
        </SheetFooter>
      );
    }

    // OTP pending
    if (isBooked && !isOtpVerified && !isReschedule) {
      return (
        <SheetFooter className="border-t">
          <Button
            onClick={() => {
              if (showOtpModal) return;
              sendOtp();
            }}
            disabled={isSendingOtp}
            className="w-full"
          >
            {isSendingOtp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Verify OTP
          </Button>
        </SheetFooter>
      );
    }

    return (
      <SheetFooter className="border-t flex-row gap-2">
        {step === 1 && (
          <Button
            variant="outline"
            onClick={() => {
              setStep(0);
              setStores([]);
              setSelectedSlot(null);
            }}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        )}
        {step === 0 && currentGeometry && (
          <Button
            onClick={() => {
              setStep(1);
              fetchSlots(currentGeometry.latitude, currentGeometry.longitude);
            }}
            className="flex-1"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
        {step === 1 && (
          <Button
            onClick={handleBook}
            disabled={!canBook || isBooking}
            className="flex-1"
          >
            {isBooking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isReschedule ? 'Reschedule' : 'Book Appointment'}
          </Button>
        )}
      </SheetFooter>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle>
              {isReschedule ? 'Reschedule Appointment' : 'Book Appointment'}
            </SheetTitle>
            <SheetDescription>
              {step === 0
                ? 'Search for the inspection location'
                : step === 1
                ? 'Select a store, date, and time slot'
                : 'Appointment status'}
            </SheetDescription>

            {/* Step indicator */}
            {step < 2 && (
              <div className="flex items-center gap-2 mt-2">
                {[
                  { label: 'Location', icon: MapPin },
                  { label: 'Slot', icon: Clock },
                ].map((s, i) => (
                  <div key={i} className="flex items-center flex-1">
                    <div
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium w-full justify-center ${
                        i === step
                          ? 'bg-blue-100 text-blue-700'
                          : i < step
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {i < step ? <Check className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                      {s.label}
                    </div>
                    {i === 0 && (
                      <div className={`w-4 h-0.5 mx-1 ${step > 0 ? 'bg-green-300' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            {step === 0
              ? renderLocationSearch()
              : step === 1
              ? renderSlots()
              : renderConfirmation()}
          </div>

          {renderFooter()}
        </SheetContent>
      </Sheet>

      {renderOtpModal()}
    </>
  );
}
