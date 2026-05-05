import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class MongoIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map(data => this.transform(data)));
  }

  private transform(data: any): any {
    if (data === null || typeof data !== 'object') {
      return data;
    }

    if (data instanceof Date) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.transform(item));
    }

    const transformedData: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (key === '_id') {
          transformedData['id'] = data['_id'];
        } else {
          transformedData[key] = this.transform(data[key]);
        }
      }
    }
    
    // If we have an id and _id, make sure we prefer the id but map _id if id is missing
    if (data._id && !data.id) {
        transformedData.id = data._id;
    }

    return transformedData;
  }
}
