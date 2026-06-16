import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseInterceptors,
  UploadedFile as NestUploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import {
  CertificateSuccessMessages,
  CertificateOperationSummaries,
  CertificateApiResponseDescriptions,
  CertificateErrorMessages,
  ApiResponseDescriptions,
} from '../../../shared/enums';
import { CertificateService } from '../services/certificate.service';
import { CreateCertificateDto } from '../dto/create-certificate.dto';
import { ResponseCertificateDto } from '../dto/response-certificate.dto';
import { UpdateCertificateStatusDto } from '../dto/update-certificate-status.dto';
import { UploadDocumentResponseDto } from '../dto/upload-document-response.dto';
import type { UploadedFile } from '../../../shared/aws/interfaces/s3.interface';

@ApiTags('Certificates')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('certificates')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) { }

  @Post('upload-document')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(pdf|jpg|jpeg|png)$/)) {
          return callback(
            new BadRequestException(
              CertificateErrorMessages.INVALID_CERTIFICATE_FILE_TYPE,
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ResponseMessage(CertificateSuccessMessages.CERTIFICATE_UPLOADED)
  @ApiOperation({ summary: 'Upload a document and get URL' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file (PDF, JPG, JPEG, PNG, max 5MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Document uploaded successfully',
    type: UploadDocumentResponseDto,
  })
  @ApiBadRequestResponse({
    description: CertificateApiResponseDescriptions.INVALID_CERTIFICATE_DATA,
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  async uploadDocument(
    @NestUploadedFile() file: UploadedFile,
  ): Promise<UploadDocumentResponseDto> {
    const result = await this.certificateService.uploadDocument(file);
    return plainToInstance(UploadDocumentResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Post('caregiver-profile/:caregiverProfileId')
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(CertificateSuccessMessages.CERTIFICATE_UPLOADED)
  @ApiOperation({ summary: CertificateOperationSummaries.UPLOAD })
  @ApiParam({
    name: 'caregiverProfileId',
    description: 'Caregiver Profile UUID',
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: CertificateSuccessMessages.CERTIFICATE_UPLOADED,
    type: ResponseCertificateDto,
  })
  @ApiBadRequestResponse({
    description: CertificateApiResponseDescriptions.INVALID_CERTIFICATE_DATA,
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  async createCertificate(
    @Param('caregiverProfileId', ParseUUIDPipe) caregiverProfileId: string,
    @Body() createCertificateDto: CreateCertificateDto,
  ): Promise<ResponseCertificateDto> {
    return this.certificateService.create(
      caregiverProfileId,
      createCertificateDto,
    );
  }

  @Get('caregiver-profile/:caregiverProfileId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(CertificateSuccessMessages.CERTIFICATES_RETRIEVED)
  @ApiOperation({ summary: CertificateOperationSummaries.GET_ALL })
  @ApiParam({
    name: 'caregiverProfileId',
    description: 'Caregiver Profile UUID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: CertificateSuccessMessages.CERTIFICATES_RETRIEVED,
    type: [ResponseCertificateDto],
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  async findAllByCaregiverProfileId(
    @Param('caregiverProfileId', ParseUUIDPipe) caregiverProfileId: string,
  ): Promise<ResponseCertificateDto[]> {
    return this.certificateService.findAllByCaregiverProfileId(
      caregiverProfileId,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(CertificateSuccessMessages.CERTIFICATE_RETRIEVED)
  @ApiOperation({ summary: CertificateOperationSummaries.GET_BY_ID })
  @ApiParam({ name: 'id', description: 'Certificate UUID', type: String })
  @ApiResponse({
    status: 200,
    description: CertificateSuccessMessages.CERTIFICATE_RETRIEVED,
    type: ResponseCertificateDto,
  })
  @ApiResponse({
    status: 404,
    description: CertificateApiResponseDescriptions.CERTIFICATE_NOT_FOUND,
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseCertificateDto> {
    return this.certificateService.findOne(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(CertificateSuccessMessages.CERTIFICATE_STATUS_UPDATED)
  @ApiOperation({ summary: CertificateOperationSummaries.UPDATE_STATUS })
  @ApiParam({ name: 'id', description: 'Certificate UUID', type: String })
  @ApiResponse({
    status: 200,
    description: CertificateSuccessMessages.CERTIFICATE_STATUS_UPDATED,
    type: ResponseCertificateDto,
  })
  @ApiResponse({
    status: 404,
    description: CertificateApiResponseDescriptions.CERTIFICATE_NOT_FOUND,
  })
  @ApiBadRequestResponse({
    description: CertificateApiResponseDescriptions.INVALID_CERTIFICATE_DATA,
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateCertificateStatusDto,
  ): Promise<ResponseCertificateDto> {
    return this.certificateService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(CertificateSuccessMessages.CERTIFICATE_DELETED)
  @ApiOperation({ summary: CertificateOperationSummaries.DELETE })
  @ApiParam({ name: 'id', description: 'Certificate UUID', type: String })
  @ApiResponse({
    status: 200,
    description: CertificateSuccessMessages.CERTIFICATE_DELETED,
  })
  @ApiResponse({
    status: 404,
    description: CertificateApiResponseDescriptions.CERTIFICATE_NOT_FOUND,
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.certificateService.delete(id);
  }
}
