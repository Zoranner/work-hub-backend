import { IsOptional } from 'class-validator';
import { UserGender } from '../entities/user.entity';

export class UpdateUserProfileDto {
  @IsOptional()
  realname: string;

  @IsOptional()
  gender: UserGender;

  @IsOptional()
  studentId: string;

  @IsOptional()
  className: string;

  @IsOptional()
  remark: string;

  @IsOptional()
  actived: boolean;
}
