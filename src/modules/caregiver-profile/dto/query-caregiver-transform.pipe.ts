import { Injectable, PipeTransform } from '@nestjs/common';
import { QueryCaregiverProfileDto } from './query-caregiver-profile.dto';
import { QueryNearbyCaregiverProfileDto } from './query-nearby-caregiver-profile.dto';

@Injectable()
export class QueryCaregiverTransformPipe implements PipeTransform {
  transform(
    value: any,
  ): QueryCaregiverProfileDto | QueryNearbyCaregiverProfileDto {
    const transformed = { ...value };

    // Transform booleans
    if (value.verified !== undefined) {
      transformed.verified = this.parseBoolean(value.verified);
    }

    if (value.availableNow !== undefined) {
      transformed.availableNow = this.parseBoolean(value.availableNow);
    }

    // Transform specializations to array
    if (value.specializations) {
      if (typeof value.specializations === 'string') {
        transformed.specializations = value.specializations
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
      } else if (Array.isArray(value.specializations)) {
        transformed.specializations = value.specializations
          .map((s: any) => String(s).trim())
          .filter(Boolean);
      } else {
        transformed.specializations = [];
      }
    } else {
      transformed.specializations = [];
    }

    // Transform numeric fields for nearby query
    if (value.lat !== undefined) {
      transformed.lat = Number(value.lat);
    }
    if (value.lng !== undefined) {
      transformed.lng = Number(value.lng);
    }
    if (value.radius !== undefined) {
      transformed.radius = Number(value.radius);
    }

    return transformed as
      | QueryCaregiverProfileDto
      | QueryNearbyCaregiverProfileDto;
  }

  private parseBoolean(value: any): boolean | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  }
}
