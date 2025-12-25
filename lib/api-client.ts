// super-admin/lib/api-client.ts
// API Client для подключения к бэкенду CSMS

import { API_CONFIG } from './config';

// Используем NEXT_PUBLIC_API_URL из env (устанавливается через nginx)
// Default: через nginx на порту 80 (замените YOUR_SERVER_IP на IP вашего сервера)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || API_CONFIG.baseUrl || 'http://YOUR_SERVER_IP/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'operator';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'superadmin' | 'admin' | 'operator';
}

// ========== Auth API ==========

export async function login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return response.json();
}

export async function register(data: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function logout(token: string): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

export async function refreshToken(userId: string, refreshToken: string): Promise<ApiResponse<AuthTokens>> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, refreshToken }),
  });
  return response.json();
}

export async function changePassword(token: string, oldPassword: string, newPassword: string): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  return response.json();
}

export async function getMe(token: string): Promise<ApiResponse<{ user: User }>> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// ========== Devices API ==========

export interface Device {
  id: string;
  vendor?: string;
  model?: string;
  serial?: string;
  firmware?: string;
  online: boolean;
  status: 'online' | 'offline' | 'unknown';
  lastSeenAt: string | null;
  connectorCount: number;
  createdAt: string;
}

export interface DeviceDetail extends Device {
  connectors: Array<{
    id: number;
    status: string;
    transactionId?: string;
    updatedAt: string;
  }>;
  activeSession?: {
    id: string;
    connectedAt: string;
    cause?: string;
  } | null;
  sessionHistory: Array<{
    id: string;
    connectedAt: string;
    disconnectedAt: string | null;
    cause?: string;
    duration: number | null;
  }>;
}

export async function getDevices(token: string, onlineOnly = false): Promise<ApiResponse<{ devices: Device[]; total: number }>> {
  const url = `${API_BASE_URL}/api/admin/devices${onlineOnly ? '?online=true' : ''}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

export async function getDeviceById(token: string, deviceId: string): Promise<ApiResponse<DeviceDetail>> {
  const response = await fetch(`${API_BASE_URL}/api/admin/devices/${deviceId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// ========== Remote Control API ==========

export interface RemoteStartRequest {
  chargePointId: string;
  connectorId: number;
  idTag?: string;
  meterStart?: number;
}

export interface RemoteStartResponse {
  commandId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'timeout' | 'failed';
  transactionId?: string;
}

export async function remoteStartSession(token: string, data: RemoteStartRequest): Promise<ApiResponse<RemoteStartResponse>> {
  const response = await fetch(`${API_BASE_URL}/api/admin/remote-start-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

export interface RemoteStopRequest {
  chargePointId: string;
  connectorId: number;
  transactionId?: string;
}

export interface RemoteStopResponse {
  commandId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'timeout' | 'failed';
  transactionId?: string;
}

export async function remoteStopSession(token: string, data: RemoteStopRequest): Promise<ApiResponse<RemoteStopResponse>> {
  const response = await fetch(`${API_BASE_URL}/api/admin/remote-stop-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// ========== Commands API ==========

export interface AdminCommand {
  id: string;
  userId: string;
  action: string;
  chargePointId: string;
  connectorId?: number;
  transactionId?: string;
  payload?: any;
  status: 'pending' | 'accepted' | 'rejected' | 'timeout' | 'failed';
  resultMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetCommandsParams {
  stationId?: string;
  status?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

export async function getCommands(token: string, params?: GetCommandsParams): Promise<ApiResponse<{ commands: AdminCommand[]; total: number; limit: number; offset: number }>> {
  const queryParams = new URLSearchParams();
  if (params?.stationId) queryParams.set('stationId', params.stationId);
  if (params?.status) queryParams.set('status', params.status);
  if (params?.action) queryParams.set('action', params.action);
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.offset) queryParams.set('offset', params.offset.toString());

  const url = `${API_BASE_URL}/api/admin/commands${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

export async function getCommandById(token: string, commandId: string): Promise<ApiResponse<AdminCommand>> {
  const response = await fetch(`${API_BASE_URL}/api/admin/commands/${commandId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// ========== Transactions API ==========

export interface Transaction {
  id: string;
  chargePointId: string;
  connectorId: number;
  idTag: string;
  startTime: string;
  stopTime?: string | null;
  meterStart: number;
  meterStop?: number;
  totalKWh?: number;
  cost?: number;
}

export interface GetTransactionsParams {
  chargePointId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export async function getTransactions(token: string, params?: GetTransactionsParams): Promise<ApiResponse<{ transactions: Transaction[]; total: number; limit: number; offset: number }>> {
  const queryParams = new URLSearchParams();
  if (params?.chargePointId) queryParams.set('chargePointId', params.chargePointId);
  if (params?.status) queryParams.set('status', params.status);
  if (params?.startDate) queryParams.set('startDate', params.startDate);
  if (params?.endDate) queryParams.set('endDate', params.endDate);
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.offset) queryParams.set('offset', params.offset.toString());

  const url = `${API_BASE_URL}/api/transactions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

export async function getActiveTransactions(token: string): Promise<ApiResponse<{ transactions: Transaction[]; total: number }>> {
  const response = await fetch(`${API_BASE_URL}/api/transactions/active`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// ========== Stations API (Superadmin Format) ==========

export interface Station {
  stationId: string;
  displayName: string;
  siteId: string;
  isConnected: boolean;
  status: string;
  maintenanceMode: boolean;
  connectors: Array<{
    connectorId: number;
    status: string;
    currentPower?: number;
    type: string;
    maxPower: number;
    activeTransactionId?: string | null;
  }>;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
    siteName: string;
  } | null;
  lastHeartbeat: string | null;
}

export interface GetStationsParams {
  siteId?: string;
  search?: string;
  limit?: number;
  skip?: number;
}

export async function getStations(token: string, params?: GetStationsParams): Promise<ApiResponse<{ data: Station[]; total: number; limit: number; skip: number }>> {
  const queryParams = new URLSearchParams();
  if (params?.siteId) queryParams.set('siteId', params.siteId);
  if (params?.search) queryParams.set('search', params.search);
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.skip) queryParams.set('skip', params.skip.toString());

  const url = `${API_BASE_URL}/stations${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

export async function getStationById(token: string, stationId: string): Promise<ApiResponse<Station>> {
  const response = await fetch(`${API_BASE_URL}/stations/${stationId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// ========== Sites API ==========

export interface Site {
  siteId: string;
  name: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  stats?: {
    totalStations: number;
    connectedStations: number;
    activeChargingSessions: number;
  };
  createdAt: string;
}

export async function getSites(token: string): Promise<ApiResponse<Site[]>> {
  const response = await fetch(`${API_BASE_URL}/sites`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

export async function getSiteById(token: string, siteId: string): Promise<ApiResponse<Site>> {
  const response = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// ========== Analytics API ==========

export interface DashboardData {
  global: {
    totalSessions: number;
    totalEnergyKwh: number;
    totalRevenue: number;
    activeSessions: number;
    activeStations: number;
    totalUsers: number;
  };
  topStations: Array<{
    stationId: string;
    displayName: string;
    sessions: number;
    energyKwh: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    timestamp: string;
    type: string;
    stationId: string;
    message: string;
  }>;
}

export async function getDashboard(token: string): Promise<ApiResponse<DashboardData>> {
  const response = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

export interface TrendsData {
  period: string;
  trends: Array<{
    date: string;
    sessions: number;
    energyKwh: number;
    revenue: number;
    avgSessionDuration: number;
  }>;
  summary: {
    totalSessions: number;
    totalEnergy: number;
    totalRevenue: number;
    avgDailyRevenue: number;
  };
}

export async function getTrends(token: string, period = 'daily', days = 30): Promise<ApiResponse<TrendsData>> {
  const url = `${API_BASE_URL}/analytics/trends?period=${period}&days=${days}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// ========== Health Check ==========

export async function getHealth(): Promise<ApiResponse<{ status: string; services: { mongodb: string; postgres: string; redis: string }; timestamp: string }>> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}

// ========== API Client Object (для совместимости с существующим кодом) ==========

export const apiClient = {
  auth: {
    login: async (email: string, password: string) => {
      return login({ email, password });
    },
    register: async (data: RegisterRequest) => {
      return register(data);
    },
    logout: async (token: string) => {
      return logout(token);
    },
    refresh: async (userId: string, refreshTokenValue: string) => {
      return refreshToken(userId, refreshTokenValue);
    },
    changePassword: async (token: string, oldPassword: string, newPassword: string) => {
      return changePassword(token, oldPassword, newPassword);
    },
    me: async (token: string) => {
      return getMe(token);
    },
  },
  stations: {
    getAll: async (params?: GetStationsParams) => {
      // Получаем токен из localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        return { success: false, error: 'No token' } as ApiResponse<Station[]>;
      }
      const response = await getStations(token, params);
      // Преобразуем формат ответа для совместимости
      // Бэкенд возвращает: { success: true, data: Station[] } (массив напрямую в data)
      if (response.success && response.data) {
        const responseData = response.data as any;
        const stationsData = Array.isArray(responseData) 
          ? responseData 
          : (responseData.data || []);
        return {
          success: true,
          data: stationsData,
        } as ApiResponse<Station[]>;
      }
      return { success: false, error: 'Failed to load stations' } as ApiResponse<Station[]>;
    },
    getById: async (stationId: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        return { success: false, error: 'No token' } as ApiResponse<Station>;
      }
      return getStationById(token, stationId);
    },
    remoteControl: async (stationId: string, action: string, payload: any) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        return { success: false, error: 'No token' } as ApiResponse;
      }
      if (action === 'RemoteStartTransaction') {
        return remoteStartSession(token, {
          chargePointId: stationId,
          connectorId: payload.connectorId || 1,
          idTag: payload.idTag,
        });
      } else if (action === 'RemoteStopTransaction') {
        return remoteStopSession(token, {
          chargePointId: stationId,
          connectorId: payload.connectorId || 1,
          transactionId: payload.transactionId,
        });
      }
      return { success: false, error: 'Unknown action' } as ApiResponse;
    },
  },
  sites: {
    getAll: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        return { success: false, error: 'No token' } as ApiResponse<Site[]>;
      }
      const response = await getSites(token);
      // Преобразуем формат ответа
      if (response.success && response.data) {
        return {
          success: true,
          data: Array.isArray(response.data) ? response.data : [],
        } as ApiResponse<Site[]>;
      }
      return response as ApiResponse<Site[]>;
    },
    getById: async (siteId: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        return { success: false, error: 'No token' } as ApiResponse<Site>;
      }
      return getSiteById(token, siteId);
    },
  },
  transactions: {
    getAll: async (params?: GetTransactionsParams) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        return { success: false, error: 'No token' } as ApiResponse<Transaction[]>;
      }
      const response = await getTransactions(token, params);
      // Преобразуем формат ответа
      // Бэкенд возвращает: { success: true, data: Transaction[] } (массив напрямую в data)
      if (response.success && response.data) {
        const responseData = response.data as any;
        const transactionsData = Array.isArray(responseData) 
          ? responseData 
          : (responseData.transactions || []);
        return {
          success: true,
          data: transactionsData,
        } as ApiResponse<Transaction[]>;
      }
      return { success: false, error: 'Failed to load transactions' } as ApiResponse<Transaction[]>;
    },
    getActive: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        return { success: false, error: 'No token' } as ApiResponse<Transaction[]>;
      }
      return getActiveTransactions(token);
    },
  },
  analytics: {
    getDashboard: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        return { success: false, error: 'No token' } as ApiResponse<DashboardData>;
      }
      return getDashboard(token);
    },
    getTrends: async (period = 'daily', days = 30) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        return { success: false, error: 'No token' } as ApiResponse<TrendsData>;
      }
      return getTrends(token, period, days);
    },
  },
  devices: {
    getAll: async (onlineOnly = false) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        return { success: false, error: 'No token' } as ApiResponse<Device[]>;
      }
      return getDevices(token, onlineOnly);
    },
    getById: async (deviceId: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        return { success: false, error: 'No token' } as ApiResponse<DeviceDetail>;
      }
      return getDeviceById(token, deviceId);
    },
  },
  commands: {
    getAll: async (params?: GetCommandsParams) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        return { success: false, error: 'No token' } as ApiResponse<AdminCommand[]>;
      }
      return getCommands(token, params);
    },
    getById: async (commandId: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        return { success: false, error: 'No token' } as ApiResponse<AdminCommand>;
      }
      return getCommandById(token, commandId);
    },
  },
};
