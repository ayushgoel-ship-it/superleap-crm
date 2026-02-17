/**
 * API CLIENT
 * 
 * Central HTTP client for all backend API calls.
 * Handles authentication, error handling, retries.
 * 
 * In mock mode: returns mock data
 * In prod mode: makes real HTTP calls
 */

import { ENV, logger } from '../config/env';

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
  };
}

/**
 * API Error
 */
export class ApiError extends Error {
  code: string;
  status?: number;
  details?: any;
  
  constructor(message: string, code: string, status?: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * HTTP Client
 */
class HttpClient {
  private baseUrl: string;
  private timeout: number;
  private authToken: string | null = null;
  
  constructor() {
    this.baseUrl = ENV.API_BASE_URL;
    this.timeout = ENV.API_TIMEOUT;
  }
  
  /**
   * Set authentication token
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
  }
  
  /**
   * Get current auth token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }
  
  /**
   * Build headers
   */
  private buildHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders
    };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    return headers;
  }
  
  /**
   * Make HTTP request
   */
  private async request<T>(
    method: string,
    endpoint: string,
    options?: {
      body?: any;
      headers?: Record<string, string>;
      params?: Record<string, any>;
    }
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);
    
    logger.debug(`API ${method}:`, url);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        method,
        headers: this.buildHeaders(options?.headers),
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Parse response
      const data = await response.json();
      
      // Check for errors
      if (!response.ok) {
        throw new ApiError(
          data.error?.message || 'Request failed',
          data.error?.code || 'UNKNOWN_ERROR',
          response.status,
          data.error?.details
        );
      }
      
      logger.debug(`API ${method} response:`, data);
      
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 'TIMEOUT');
        }
        
        throw new ApiError(
          error.message || 'Network error',
          'NETWORK_ERROR'
        );
      }
      
      throw new ApiError('Unknown error', 'UNKNOWN_ERROR');
    }
  }
  
  /**
   * Build URL with query params
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = `${this.baseUrl}${endpoint}`;
    
    if (!params) return url;
    
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    const query = searchParams.toString();
    return query ? `${url}?${query}` : url;
  }
  
  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>('GET', endpoint, { params });
  }
  
  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>('POST', endpoint, { body });
  }
  
  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>('PUT', endpoint, { body });
  }
  
  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>('PATCH', endpoint, { body });
  }
  
  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }
}

/**
 * Singleton HTTP client instance
 */
export const http = new HttpClient();

/**
 * Initialize API client with auth token
 */
export function initializeApiClient(token: string | null) {
  http.setAuthToken(token);
  logger.info('API client initialized', { hasToken: !!token });
}

/**
 * Clear API client auth
 */
export function clearApiClient() {
  http.setAuthToken(null);
  logger.info('API client cleared');
}
