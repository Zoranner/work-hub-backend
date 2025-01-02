import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException, Logger } from '@nestjs/common';
import 'src/utils/math.extension';

@Injectable()
export class ValidatePagePipe implements PipeTransform {
  transform(value: number, _metadata: ArgumentMetadata) {
    value = Number.isInteger(value) ? value : 1;
    return Math.max(1, value);
  }
}

@Injectable()
export class ValidateLimitPipe implements PipeTransform {
  transform(value: number, _metadata: ArgumentMetadata) {
    value = Number.isInteger(value) ? value : 10;
    return Math.clamp(value, 0, 50);
  }
}

@Injectable()
export class ValidateBigLimitPipe implements PipeTransform {
  transform(value: number, _metadata: ArgumentMetadata) {
    value = Number.isInteger(value) ? value : 500;
    return Math.clamp(value, 0, 2000);
  }
}

@Injectable()
export class ValidateJsonPipe implements PipeTransform {
  transform(value: any, _metadata: ArgumentMetadata) {
    if (!value) {
      return value;
    }
    try {
      return JSON.parse(decodeURI(value));
    } catch (expection) {
      throw new BadRequestException('Validation failed');
    }
  }
}
