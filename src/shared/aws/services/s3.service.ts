import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CustomLogger } from '../../services/custom-logger.service';
import { ServiceTags } from '../../../common/enums/logging-tag.enum';
import {
  S3ErrorMessages,
  S3LogMessages,
} from '../../../shared/enums/messages.enums';
import {
  S3UploadResponse,
  S3UploadOptions,
  UploadedFile,
} from '../interfaces/s3.interface';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly bucketUrl: string;
  private readonly region: string;
  private readonly logTag = ServiceTags.AWS_S3_SERVICE;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLogger,
  ) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const bucketName = this.configService.get<string>(
      'AWS_S3_IMAGE_BUCKET_NAME',
    );
    const bucketUrl = this.configService.get<string>('AWS_S3_IMAGE_BUCKET_URL');

    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      this.logger.error(
        this.logTag,
        S3ErrorMessages.AWS_S3_CONFIGURATION_MISSING_ENV_VARS,
        {
          hasRegion: !!region,
          hasAccessKeyId: !!accessKeyId,
          hasSecretAccessKey: !!secretAccessKey,
          hasBucketName: !!bucketName,
        },
      );
      throw new InternalServerErrorException(
        S3ErrorMessages.AWS_S3_CONFIGURATION_INCOMPLETE,
      );
    }

    this.region = region;
    this.bucketName = bucketName;
    this.bucketUrl =
      bucketUrl || `https://${bucketName}.s3.${region}.amazonaws.com`;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log(this.logTag, S3LogMessages.AWS_S3_SERVICE_INITIALIZED, {
      region: this.region,
      bucketName: this.bucketName,
    });
  }

  /**
   * Upload a file buffer to S3
   * @param file - File buffer and metadata
   * @param options - Upload options (folder, fileName, contentType, acl)
   * @returns S3UploadResponse with URL and key
   */
  async uploadFile(
    file: UploadedFile | Buffer,
    options: S3UploadOptions = {},
  ): Promise<S3UploadResponse> {
    try {
      let buffer: Buffer;
      let originalName: string;
      let mimeType: string;

      if (Buffer.isBuffer(file)) {
        // If it's just a buffer, we need fileName and contentType in options
        if (!options.fileName || !options.contentType) {
          throw new BadRequestException(
            S3ErrorMessages.FILE_NAME_AND_CONTENT_TYPE_REQUIRED,
          );
        }
        buffer = file;
        originalName = options.fileName;
        mimeType = options.contentType;
      } else {
        // It's an UploadedFile object
        buffer = file.buffer;
        originalName = file.originalname;
        mimeType = file.mimetype;
      }

      // Generate unique file name if not provided
      const fileName =
        options.fileName || this.generateUniqueFileName(originalName);

      // Construct the S3 key (path)
      const folder = options.folder ? `${options.folder}/` : '';
      const key = `${folder}${fileName}`;

      // Determine content type
      const contentType =
        options.contentType || mimeType || 'application/octet-stream';

      // Upload to S3
      // Note: ACL is not included as modern S3 buckets use bucket policies instead
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      this.logger.log(this.logTag, S3LogMessages.UPLOADING_FILE_TO_S3, {
        bucket: this.bucketName,
        key,
        contentType,
        size: buffer.length,
      });

      await this.s3Client.send(command);

      // Construct the public URL
      const url = `${this.bucketUrl}/${key}`;
      const location = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      this.logger.log(this.logTag, S3LogMessages.FILE_UPLOADED_SUCCESSFULLY, {
        url,
        key,
        bucket: this.bucketName,
      });

      return {
        url,
        key,
        bucket: this.bucketName,
        location,
      };
    } catch (error) {
      this.logger.error(this.logTag, S3ErrorMessages.FILE_UPLOAD_FAILED, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        S3ErrorMessages.FILE_UPLOAD_FAILED,
      );
    }
  }

  /**
   * Upload an image file to S3
   * Convenience method for image uploads with common image folder structure
   * @param file - Image file buffer and metadata
   * @param folder - Optional folder path (e.g., 'profiles', 'documents')
   * @param fileName - Optional custom file name
   * @returns S3UploadResponse with URL and key
   */
  async uploadImage(
    file: UploadedFile | Buffer,
    folder?: string,
    fileName?: string,
  ): Promise<S3UploadResponse> {
    const options: S3UploadOptions = {
      folder: folder || 'images',
      fileName,
      acl: 'public-read',
    };

    if (Buffer.isBuffer(file)) {
      options.contentType = 'image/jpeg'; // Default for images
    }

    return this.uploadFile(file, options);
  }

  /**
   * Delete a file from S3
   * @param key - S3 object key (path)
   * @returns true if successful
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      this.logger.log(this.logTag, S3LogMessages.DELETING_FILE_FROM_S3, {
        bucket: this.bucketName,
        key,
      });

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(this.logTag, S3LogMessages.FILE_DELETED_SUCCESSFULLY, {
        bucket: this.bucketName,
        key,
      });

      return true;
    } catch (error) {
      this.logger.error(this.logTag, S3ErrorMessages.FILE_DELETE_FAILED, error);
      return false;
    }
  }

  /**
   * Generate a presigned URL for temporary access to a private file
   * @param key - S3 object key (path)
   * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
   * @returns Presigned URL
   */
  async getPresignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      this.logger.log(this.logTag, S3LogMessages.GENERATED_PRESIGNED_URL, {
        key,
        expiresIn,
      });

      return url;
    } catch (error) {
      this.logger.error(
        this.logTag,
        S3ErrorMessages.PRESIGNED_URL_GENERATION_FAILED,
        error,
      );
      throw new InternalServerErrorException(
        S3ErrorMessages.PRESIGNED_URL_GENERATION_FAILED,
      );
    }
  }

  /**
   * Extract S3 key from a full URL
   * @param url - Full S3 URL
   * @returns S3 key (path)
   */
  extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Remove leading slash from pathname
      return urlObj.pathname.substring(1);
    } catch {
      // If URL parsing fails, try to extract from bucket URL pattern
      const bucketUrlPattern = new RegExp(
        `https?://${this.bucketName}\\.s3[^/]*/(.+)$`,
      );
      const match = url.match(bucketUrlPattern);
      return match ? match[1] : null;
    }
  }

  /**
   * Generate a unique file name using timestamp and random string
   * @param originalName - Original file name
   * @returns Unique file name
   */
  private generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);

    // Sanitize base name (remove special characters, keep only alphanumeric, dash, underscore)
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');

    return `${sanitizedBaseName}_${timestamp}_${randomString}${ext}`;
  }
}
