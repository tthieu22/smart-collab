import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';

interface UploadBody {
  action: 'upload' | 'update' | 'delete' | 'delete_all';
  projectFolder?: string;
  public_ids?: string[];
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 20, { limits: { fileSize: 50 * 1024 * 1024 } }), // max 50MB/file, max 20 files
  )
  async handleUpload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadBody,
  ) {
    try {
      const { action, projectFolder, public_ids = [] } = body;
      if (!action) throw new Error('action is required');

      switch (action) {
        case 'upload':
          if (!projectFolder) throw new Error('projectFolder is required for upload');
          if (!files || files.length === 0) throw new Error('files are required for upload');

          const uploadResults = await Promise.all(
            files.map(f => this.uploadService.uploadFile(f, `projects/${projectFolder}`)),
          );

          return {
            success: true,
            data: uploadResults.map(r => ({
              public_id: r.public_id,
              url: r.secure_url,
              type: r.format,
              size: r.bytes,
              original_filename: r.original_filename,
              resource_type: r.resource_type,
            })),
          };

        case 'delete':
          if (public_ids.length === 0) throw new Error('public_ids required for delete');
          const deleteResults = await Promise.all(
            public_ids.map(id => this.uploadService.deleteFile(id).then(result => ({ public_id: id, result }))),
          );
          return { success: true, data: deleteResults };

        case 'delete_all':
          if (!projectFolder) throw new Error('projectFolder is required for delete_all');
          const result = await this.uploadService.deleteAllFilesInFolder(`projects/${projectFolder}`);
          return { success: true, data: result };

        default:
          throw new Error('Invalid action');
      }
    } catch (error: any) {
      return { success: false, data: error.message || 'Unknown error' };
    }
  }
}
