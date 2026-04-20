package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmcore.service.internal.Cars24LeadService;
import com.cars24.crmcore.service.internal.Cars24VehicleService;
import com.cars24.crmcore.service.internal.OlaMapsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Proxy controller for Cars24 and Ola Maps external APIs.
 *
 * <p>The frontend calls these endpoints instead of hitting C24/Ola directly.
 * The backend injects auth credentials (Basic auth, session tokens, API keys)
 * server-side, so no secrets are exposed to the browser.</p>
 *
 * <p>The session token is passed via the {@code X-C24-Session-Token} header
 * from the frontend (it's the KAM panel session cookie, rotated per user session).</p>
 */
@RestController
@RequestMapping("/web/v1/c24")
@Tag(name = "Cars24 Proxy", description = "Proxied Cars24 vehicle catalog, lead creation, and Ola Maps APIs")
public class Cars24ProxyController extends BaseController {

    private static final String SESSION_HEADER = "X-C24-Session-Token";

    private final Cars24VehicleService vehicleService;
    private final Cars24LeadService leadService;
    private final OlaMapsService olaMapsService;
    private final ApiResponseBuilder responseBuilder;

    public Cars24ProxyController(Cars24VehicleService vehicleService,
                                  Cars24LeadService leadService,
                                  OlaMapsService olaMapsService,
                                  ApiResponseBuilder responseBuilder) {
        this.vehicleService = vehicleService;
        this.leadService = leadService;
        this.olaMapsService = olaMapsService;
        this.responseBuilder = responseBuilder;
    }

    // ════════════════════════════════════════════════════════════════
    //  Vehicle Catalog
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/vehicle/makes")
    @Operation(summary = "Get car makes", description = "List all vehicle makes from C24 catalog")
    @ApiResponse(responseCode = "200", description = "Makes retrieved")
    public ResponseEntity<ApiResponseEnvelope<List<Map<String, Object>>>> getMakes(
            @RequestHeader(SESSION_HEADER) String sessionToken) {
        return ResponseEntity.ok(responseBuilder.ok(vehicleService.getMakes(sessionToken)));
    }

    @GetMapping("/vehicle/years")
    @Operation(summary = "Get years for make")
    public ResponseEntity<ApiResponseEnvelope<List<Map<String, Object>>>> getYears(
            @RequestParam("make_id") String makeId,
            @RequestHeader(SESSION_HEADER) String sessionToken) {
        return ResponseEntity.ok(responseBuilder.ok(vehicleService.getYears(makeId, sessionToken)));
    }

    @GetMapping("/vehicle/models")
    @Operation(summary = "Get models for make + year")
    public ResponseEntity<ApiResponseEnvelope<List<Map<String, Object>>>> getModels(
            @RequestParam("make_id") String makeId,
            @RequestParam("year") String year,
            @RequestHeader(SESSION_HEADER) String sessionToken) {
        return ResponseEntity.ok(responseBuilder.ok(vehicleService.getModels(makeId, year, sessionToken)));
    }

    @GetMapping("/vehicle/variants")
    @Operation(summary = "Get variants for model + year")
    public ResponseEntity<ApiResponseEnvelope<List<Map<String, Object>>>> getVariants(
            @RequestParam("model_id") String modelId,
            @RequestParam("year") String year,
            @RequestHeader(SESSION_HEADER) String sessionToken) {
        return ResponseEntity.ok(responseBuilder.ok(vehicleService.getVariants(modelId, year, sessionToken)));
    }

    @GetMapping("/vehicle/states")
    @Operation(summary = "Get all states")
    public ResponseEntity<ApiResponseEnvelope<List<Map<String, Object>>>> getStates(
            @RequestHeader(SESSION_HEADER) String sessionToken) {
        return ResponseEntity.ok(responseBuilder.ok(vehicleService.getStates(sessionToken)));
    }

    @GetMapping("/vehicle/cities")
    @Operation(summary = "Get cities for state")
    public ResponseEntity<ApiResponseEnvelope<List<Map<String, Object>>>> getCities(
            @RequestParam("state_id") String stateId,
            @RequestHeader(SESSION_HEADER) String sessionToken) {
        return ResponseEntity.ok(responseBuilder.ok(vehicleService.getCities(stateId, sessionToken)));
    }

    @GetMapping("/vehicle/rto-codes")
    @Operation(summary = "Get RTO codes for state")
    public ResponseEntity<ApiResponseEnvelope<List<Map<String, Object>>>> getRTOCodes(
            @RequestParam("state_id") String stateId,
            @RequestHeader(SESSION_HEADER) String sessionToken) {
        return ResponseEntity.ok(responseBuilder.ok(vehicleService.getRTOCodes(stateId, sessionToken)));
    }

    @GetMapping("/vehicle/lookup/{regNo}")
    @Operation(summary = "Lookup vehicle by registration number")
    public ResponseEntity<ApiResponseEnvelope<Map<String, Object>>> lookupVehicle(
            @PathVariable("regNo") String regNo,
            @RequestHeader(SESSION_HEADER) String sessionToken) {
        return ResponseEntity.ok(responseBuilder.ok(vehicleService.lookupVehicle(regNo, sessionToken)));
    }

    // ════════════════════════════════════════════════════════════════
    //  Partners Lead — Price Estimation + Lead Creation
    // ════════════════════════════════════════════════════════════════

    @PostMapping("/leads/{dealerCode}/estimate-price")
    @Operation(summary = "Estimate price range", description = "Get C24 estimated price for a vehicle")
    public ResponseEntity<ApiResponseEnvelope<Map<String, Object>>> estimatePrice(
            @PathVariable("dealerCode") String dealerCode,
            @RequestBody Map<String, Object> payload,
            @RequestHeader(SESSION_HEADER) String sessionToken) {
        return ResponseEntity.ok(responseBuilder.ok(
                leadService.estimatePrice(dealerCode, payload, sessionToken)));
    }

    @PostMapping("/leads/{dealerCode}/create")
    @Operation(summary = "Create C24 lead", description = "Create a lead via C24 partners-lead API")
    public ResponseEntity<ApiResponseEnvelope<Map<String, Object>>> createLead(
            @PathVariable("dealerCode") String dealerCode,
            @RequestBody Map<String, Object> payload,
            @RequestHeader(SESSION_HEADER) String sessionToken) {
        return ResponseEntity.ok(responseBuilder.ok(
                leadService.createLead(dealerCode, payload, sessionToken)));
    }

    // ════════════════════════════════════════════════════════════════
    //  Partners Lead — Appointment Booking
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/leads/{dealerCode}/{leadId}/slots")
    @Operation(summary = "Get appointment slots", description = "Available slots for store/home inspection")
    public ResponseEntity<ApiResponseEnvelope<Map<String, Object>>> getSlots(
            @PathVariable("dealerCode") String dealerCode,
            @PathVariable("leadId") String leadId,
            @RequestParam("lat") double lat,
            @RequestParam("lng") double lng,
            @RequestHeader(SESSION_HEADER) String sessionToken) {
        return ResponseEntity.ok(responseBuilder.ok(
                leadService.getSlots(leadId, dealerCode, lat, lng, sessionToken)));
    }

    @PostMapping("/leads/{dealerCode}/{leadId}/book-appointment")
    @Operation(summary = "Book appointment")
    public ResponseEntity<ApiResponseEnvelope<Map<String, Object>>> bookAppointment(
            @PathVariable("dealerCode") String dealerCode,
            @PathVariable("leadId") String leadId,
            @RequestBody Map<String, Object> payload,
            @RequestHeader(SESSION_HEADER) String sessionToken) {
        return ResponseEntity.ok(responseBuilder.ok(
                leadService.bookAppointment(leadId, dealerCode, payload, sessionToken)));
    }

    @PostMapping("/leads/{dealerCode}/{leadId}/reschedule-appointment")
    @Operation(summary = "Reschedule appointment")
    public ResponseEntity<ApiResponseEnvelope<Map<String, Object>>> rescheduleAppointment(
            @PathVariable("dealerCode") String dealerCode,
            @PathVariable("leadId") String leadId,
            @RequestBody Map<String, Object> payload,
            @RequestHeader(SESSION_HEADER) String sessionToken) {
        return ResponseEntity.ok(responseBuilder.ok(
                leadService.rescheduleAppointment(leadId, dealerCode, payload, sessionToken)));
    }

    @PostMapping("/leads/{dealerCode}/{leadId}/send-otp")
    @Operation(summary = "Send appointment OTP")
    public ResponseEntity<ApiResponseEnvelope<Map<String, Object>>> sendOtp(
            @PathVariable("dealerCode") String dealerCode,
            @PathVariable("leadId") String leadId,
            @RequestHeader(SESSION_HEADER) String sessionToken) {
        return ResponseEntity.ok(responseBuilder.ok(
                leadService.sendOtp(leadId, dealerCode, sessionToken)));
    }

    @PostMapping("/leads/{dealerCode}/{leadId}/verify-otp")
    @Operation(summary = "Verify appointment OTP")
    public ResponseEntity<ApiResponseEnvelope<Map<String, Object>>> verifyOtp(
            @PathVariable("dealerCode") String dealerCode,
            @PathVariable("leadId") String leadId,
            @RequestBody Map<String, Object> payload,
            @RequestHeader(SESSION_HEADER) String sessionToken) {
        String otp = payload.getOrDefault("otp", "").toString();
        return ResponseEntity.ok(responseBuilder.ok(
                leadService.verifyOtp(leadId, dealerCode, otp, sessionToken)));
    }

    // ════════════════════════════════════════════════════════════════
    //  Ola Maps — Location Search
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/maps/autocomplete")
    @Operation(summary = "Location autocomplete", description = "Search locations via Ola Maps")
    public ResponseEntity<ApiResponseEnvelope<List<Map<String, Object>>>> searchLocation(
            @RequestParam("query") String query) {
        return ResponseEntity.ok(responseBuilder.ok(olaMapsService.searchLocation(query)));
    }

    @GetMapping("/maps/reverse-geocode")
    @Operation(summary = "Reverse geocode", description = "Get address from lat/lng via Ola Maps")
    public ResponseEntity<ApiResponseEnvelope<Map<String, Object>>> reverseGeocode(
            @RequestParam("lat") double lat,
            @RequestParam("lng") double lng) {
        return ResponseEntity.ok(responseBuilder.ok(olaMapsService.reverseGeocode(lat, lng)));
    }
}
