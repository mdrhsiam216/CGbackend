export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
  timestamp: string;
  path: string;
  statusCode: number;
}

export interface PaginatedData<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T = any> extends Omit<ApiResponse, 'data'> {
  data: PaginatedData<T>;
}
