// Centralized localStorage keys for auth module
export const LS_SESSION_KEY = "superleap_session_v1";
export const LS_PROFILE_KEY = "superleap_profiles_v1"; // map userId->profile
export const LS_PASSWORDS_KEY = "superleap_passwords_v1"; // map email->password (mock)
export const LS_RESET_KEY = "superleap_reset_v1"; // otp/reset state
export const LS_OTP_TIMESTAMP_KEY = "superleap_otp_timestamp_v1"; // rate limiting
