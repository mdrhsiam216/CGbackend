/**
 * Interface for S3 upload response
 */
export interface S3UploadResponse {
  url: string;
  key: string;
  bucket: string;
  location: string;
}

/**
 * Interface for S3 upload options
 */
export interface S3UploadOptions {
  folder?: string;
  fileName?: string;
  contentType?: string;
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
}

/**
 * Interface for file upload (from Express Multer or similar)
 */
export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}
