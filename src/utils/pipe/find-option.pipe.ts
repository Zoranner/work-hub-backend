import 'src/utils/math.extension';
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import {
  FindOptionsWhere,
  FindOptionsOrder,
  LessThan,
  LessThanOrEqual,
  Like,
  MoreThan,
  MoreThanOrEqual,
  And,
  FindOperator,
  Or,
  In,
  ArrayContains,
  Between,
} from 'typeorm';
import 'src/utils/number.extention';
import dayjs from 'dayjs';
import 'dayjs/plugin/utc';

enum ConditionType {
  Equal = 0, // 等于
  Like = 1, // 相似
  LessThan = 10, // 小于
  LessThanOrEqual = 11, // 小于等于
  MoreThan = 12, // 大于
  MoreThanOrEqual = 13, // 大于等于
  In = 20, // 在...范围内
  ArrayContains = 30, // 包含
  DateTimeLike = 40, // 时间近似
  And = 90, // 和
  Or = 91, // 或
}

class WhereCondition {
  type: ConditionType;
  value: any;
}

@Injectable()
export class ValidateWherePipe<Entity> implements PipeTransform {
  transform(value: string, _metadata: ArgumentMetadata) {
    if (!value) {
      return null;
    }
    let result: FindOptionsWhere<Entity> = {};
    let whereObject = JSON.parse(value);
    if (whereObject) {
      Object.keys(whereObject).forEach(field => {
        let condition = whereObject[field];
        if (condition.value !== null || undefined) {
          if (field.includes('.')) {
            const [field1, field2] = field.split('.');
            if (!result[field1]) {
              result[field1] = {};
            }
            result[field1][field2] = this.handleCondition(condition);
            return;
          } else {
            result[field] = this.handleCondition(condition);
          }
        }
      });
    }
    return result;
  }

  private handleCondition(condition: WhereCondition) {
    switch (condition.type) {
      case ConditionType.Equal:
      default:
        return condition.value;
      case ConditionType.Like:
        return Like(`%${condition.value}%`);
      case ConditionType.LessThan:
        return LessThan(condition.value);
      case ConditionType.LessThanOrEqual:
        return LessThanOrEqual(condition.value);
      case ConditionType.MoreThan:
        return MoreThan(condition.value);
      case ConditionType.MoreThanOrEqual:
        return MoreThanOrEqual(condition.value);
      case ConditionType.In:
        return In(condition.value);
      case ConditionType.ArrayContains:
        return ArrayContains(Array.isArray(condition.value) ? condition.value : [condition.value]);
      case ConditionType.DateTimeLike:
        let year: number, month: number, day: number;
        let startDate: dayjs.Dayjs, endDate: dayjs.Dayjs;
        const dateArray = condition.value as number[];
        switch (dateArray.length) {
          case 1:
            year = Math.clamp(condition.value[0], 0, 9999);
            startDate = dayjs.utc(`${year.prefixInteger(4)}`, 'YYYY');
            endDate = startDate.add(1, 'year').subtract(1, 'second');
            break;
          case 2:
            year = Math.clamp(condition.value[0], 0, 9999);
            month = Math.clamp(condition.value[1], 1, 12);
            startDate = dayjs.utc(`${year.prefixInteger(4)}-${month.prefixInteger(2)}`, 'YYYY-MM');
            endDate = startDate.add(1, 'month').subtract(1, 'second');
            break;
          case 3:
            year = Math.clamp(condition.value[0], 0, 9999);
            month = Math.clamp(condition.value[1], 1, 12);
            day = Math.clamp(condition.value[2], 1, 31);
            startDate = dayjs.utc(`${year.prefixInteger(4)}-${month.prefixInteger(2)}-${day.prefixInteger(2)}`, 'YYYY-MM-DD');
            endDate = startDate.add(1, 'day').subtract(1, 'second');
            break;
        }
        return Between(startDate, endDate);
      case ConditionType.And:
        const andConditions: FindOperator<Entity>[] = [];
        condition.value.forEach((childCondition: WhereCondition) => {
          let andCondition = this.handleCondition(childCondition);
          if (andCondition) {
            andConditions.push(andCondition);
          }
        });
        return And<Entity>(...andConditions);
      case ConditionType.Or:
        const orConditions: FindOperator<Entity>[] = [];
        condition.value.forEach((childCondition: WhereCondition) => {
          let orCondition = this.handleCondition(childCondition);
          if (orCondition) {
            orConditions.push(orCondition);
          }
        });
        return Or<Entity>(...orConditions);
    }
  }
}

enum OrderType {
  Asc = 0, // 正序
  Desc = 1, // 倒序
}

@Injectable()
export class ValidateOrderPipe<Entity> implements PipeTransform {
  transform(value: string, _metadata: ArgumentMetadata) {
    if (!value) {
      return null;
    }
    let result: FindOptionsOrder<Entity> = {};
    let orderObject = JSON.parse(value);
    if (orderObject) {
      Object.keys(orderObject).forEach(field => {
        let orderType = orderObject[field];
        switch (orderType) {
          case OrderType.Asc:
            result[field] = 'ASC';
            break;
          case OrderType.Desc:
            result[field] = 'DESC';
            break;
          default:
            result[field] = 'ASC';
            break;
        }
      });
    }
    return result;
  }
}

@Injectable()
export class ValidateArray<Type> implements PipeTransform {
  transform(value: string, _metadata: ArgumentMetadata) {
    if (!value) {
      return null;
    }
    const result: Type[] = JSON.parse(value);
    return result;
  }
}
