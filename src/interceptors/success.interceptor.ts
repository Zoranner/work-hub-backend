import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import '../utils/json.extension';

@Injectable()
export class SuccessInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SuccessInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const ctx = context.switchToHttp();
    const requestUrl = ctx.getRequest().url;
    return next.handle().pipe(
      map((data: any) => {
        this.logger.log(`[${requestUrl}] ${JSON.stringify(data)} +${Date.now() - now}ms`);
        return {
          code: 1,
          message: '请求成功',
          result: data,
        };
      }),
    );
  }
}
