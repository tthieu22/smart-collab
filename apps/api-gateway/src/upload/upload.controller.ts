import { Controller, Post, Body } from '@nestjs/common';
import { UploadService } from './upload.service';

interface UploadBody {
  action: 'upload' | 'update' | 'delete' | 'delete_all';
  projectFolder?: string; // folder project
  files?: string[];        // base64 string
  public_ids?: string[];
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  async handleUpload(@Body() body: UploadBody) {
    try {
      const { action, projectFolder, files = [], public_ids = [] } = body;

      if (!action) throw new Error('action is required');

      switch (action) {
        case 'upload':
          if (!projectFolder) throw new Error('projectFolder is required for upload');
          if (files.length === 0) throw new Error('files are required for upload');
          const uploadResults = await Promise.all(
            files.map((f) => this.uploadService.uploadBase64(f, `projects/${projectFolder}`)),
          );
          return {
            success: true,
            data: uploadResults.map((r) => ({
              public_id: r.public_id,
              url: r.secure_url,
              type: r.format,
              size: r.bytes,
              original_filename: r.original_filename,
              resource_type: r.resource_type,
            })),
          };

        case 'update':
          if (!projectFolder) throw new Error('projectFolder is required for update');
          if (files.length === 0 || public_ids.length === 0)
            throw new Error('files and public_ids are required for update');
          if (files.length !== public_ids.length)
            throw new Error('files and public_ids length must match');

          const updateResults = [];
          for (let i = 0; i < files.length; i++) {
            const result = await this.uploadService.updateFile(
              public_ids[i],
              files[i],
              `projects/${projectFolder}`,
            );
            updateResults.push({
              public_id: result.public_id,
              url: result.secure_url,
              type: result.format,
              size: result.bytes,
              original_filename: result.original_filename,
              resource_type: result.resource_type,
            });
          }
          return { success: true, data: updateResults };

        case 'delete':
          if (public_ids.length === 0) throw new Error('public_ids required for delete');
          const deleteResults = [];
          for (const id of public_ids) {
            const result = await this.uploadService.deleteFile(id);
            deleteResults.push({ public_id: id, result });
          }
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
