import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: Error, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const now = Date.now();
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const requestUrl = httpAdapter.getRequestUrl(ctx.getRequest());
    const isHttpException = exception instanceof HttpException;
    const httpStatus: number = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const httpResponse: any = isHttpException ? exception.getResponse() : exception;
    if (typeof httpResponse.message === 'object') {
      httpResponse.message = httpResponse.message.join('，');
    }
    httpResponse.message = `${httpResponse.message}，请检查后重试。`;
    const responseBody = {
      code: -1,
      error: httpResponse.error,
      message: httpResponse.message,
    };
    this.logger.error(`[${requestUrl}] ${exception.stack} +${Date.now() - now}ms`);
    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    //throw exception;
  }
}
