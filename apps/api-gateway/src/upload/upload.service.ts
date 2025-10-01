import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  private streamUpload(fileBuffer: Buffer, folder: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload failed: result is undefined'));
          resolve(result);
        },
      );
      const stream = Readable.from(fileBuffer);
      stream.pipe(uploadStream);
    });
  }

  async uploadBase64(base64Data: string, folder: string): Promise<UploadApiResponse> {
    if (!base64Data) throw new BadRequestException('File is empty');
    const buffer = Buffer.from(base64Data, 'base64');
    return this.streamUpload(buffer, folder);
  }

  async deleteFile(publicId: string): Promise<any> {
    if (!publicId) throw new BadRequestException('public_id is required');
    return cloudinary.uploader.destroy(publicId);
  }

  async updateFile(publicId: string, base64Data: string, folder: string): Promise<UploadApiResponse> {
    await this.deleteFile(publicId);
    return this.uploadBase64(base64Data, folder);
  }

  async deleteAllFilesInFolder(folder: string): Promise<any> {
    if (!folder) throw new BadRequestException('folder is required');
    const result = await cloudinary.api.delete_resources_by_prefix(folder);
    return result;
  }
}
