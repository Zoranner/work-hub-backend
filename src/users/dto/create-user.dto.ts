import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserGender } from '../entities/user.entity';

export class CreateUserDto {
  @IsNotEmpty({ message: '账户不能为空' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  password: string;

  @IsNotEmpty({ message: '真实姓名不能为空' })
  @IsString()
  realname: string;

  @IsNotEmpty({ message: '性别不能为空' })
  @IsEnum(UserGender)
  gender: UserGender;

  @IsNotEmpty({ message: '学号不能为空' })
  @IsString()
  studentId: string;

  @IsNotEmpty({ message: '班级不能为空' })
  @IsString()
  className: string;

  @IsOptional()
  @IsString()
  remark: string;

  @IsOptional()
  avatarOption: { seed: string; color: string };

  @IsOptional({ message: '激活状态不能为空' })
  actived: boolean;
}
