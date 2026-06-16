import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomLogger } from './custom-logger.service';
import { ServiceTags } from '../../common/enums/logging-tag.enum';

@Injectable()
export class SmsService {
  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly apiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLogger,
  ) {
    this.apiKey = this.configService.get<string>('BULKSMSBD_API_KEY') || '';
    this.senderId = this.configService.get<string>('BULKSMSBD_SENDER_ID') || '';
    this.apiUrl =
      this.configService.get<string>('BULKSMSBD_API_URL') ||
      'http://bulksmsbd.net/api/smsapi';
  }

  /**
   * Send SMS via bulksmsbd.net API
   */
  async sendSms(to: string, message: string): Promise<boolean> {
    try {
      this.logger.log(ServiceTags.SMS_SERVICE, `Sending SMS to ${to}`);

      if (!this.apiKey || !this.senderId) {
        this.logger.error(
          ServiceTags.SMS_SERVICE,
          'BulkSMSBD API key or Sender ID not configured',
        );
        throw new BadRequestException('SMS service not configured');
      }

      const formattedPhone = this.formatBangladeshPhone(to);

      const params = new URLSearchParams();
      params.append('api_key', this.apiKey);
      params.append('senderid', this.senderId);
      params.append('number', formattedPhone);
      params.append('message', message);

      this.logger.log(
        ServiceTags.SMS_SERVICE,
        `Calling SMS API: ${this.apiUrl}`,
        {
          phone: formattedPhone,
          senderId: this.senderId,
        },
      );

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          ServiceTags.SMS_SERVICE,
          `SMS API returned error status: ${response.status} ${response.statusText}`,
          {
            status: response.status,
            statusText: response.statusText,
            responseBody: errorText,
            phone: formattedPhone,
          },
        );
        return false;
      }

      // Try to parse JSON response
      let data;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText);
      } catch (parseError) {
        this.logger.error(
          ServiceTags.SMS_SERVICE,
          `Failed to parse SMS API response as JSON`,
          {
            error:
              parseError instanceof Error
                ? parseError.message
                : String(parseError),
            phone: formattedPhone,
          },
        );
        return false;
      }

      // According to BulkSMSBD docs, 202 is success
      if (data.response_code === 202) {
        this.logger.log(
          ServiceTags.SMS_SERVICE,
          `SMS sent successfully to ${to}`,
          {
            response: data,
            formattedPhone,
          },
        );
        return true;
      } else {
        this.logger.error(
          ServiceTags.SMS_SERVICE,
          `Failed to send SMS to ${to}. API returned error code: ${data.response_code}`,
          {
            responseCode: data.response_code,
            errorMessage: data.error_message || data.message || 'Unknown error',
            fullResponse: data,
            phone: formattedPhone,
          },
        );
        return false;
      }
    } catch (error) {
      // Better error logging with proper serialization
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : typeof error,
        phone: to,
        apiUrl: this.apiUrl,
      };

      this.logger.error(
        ServiceTags.SMS_SERVICE,
        `Error sending SMS to ${to}: ${errorDetails.message}`,
        errorDetails,
      );
      return false;
    }
  }

  /**
   * Format Bangladesh phone number for international format
   * Accepts: +8801XXXXXXXXX, 8801XXXXXXXXX, 01XXXXXXXXX
   * Returns: 8801XXXXXXXXX (bulksmsbd.net format)
   */
  private formatBangladeshPhone(phone: string): string {
    // Remove all spaces, dashes, and special characters except +
    let cleaned = phone.replace(/[\s\-()]/g, '');

    // Remove leading +
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }

    // If starts with 880, return as is
    if (cleaned.startsWith('880')) {
      return cleaned;
    }

    // If starts with 0, replace with 880
    if (cleaned.startsWith('0')) {
      return '880' + cleaned.substring(1);
    }

    // If no country code, add 880
    if (cleaned.length === 10) {
      return '880' + cleaned;
    }

    return cleaned;
  }

  /**
   * Send OTP SMS
   */
  async sendOtpSms(phone: string, otp: string): Promise<boolean> {
    const message = `Your Caregiver Platform verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;
    return this.sendSms(phone, message);
  }

  /**
   * Send password reset OTP SMS
   */
  async sendPasswordResetSms(phone: string, otp: string): Promise<boolean> {
    const message = `Your Caregiver Platform password reset code is: ${otp}. This code will expire in 10 minutes. If you did not request this, please ignore this message.`;
    return this.sendSms(phone, message);
  }
}
