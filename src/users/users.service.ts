import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, FindOptionsOrder, FindOptionsWhere, Like, MoreThan, Not, Or, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { User, RightRole } from './entities/user.entity';
import { nanoid } from 'nanoid';
import { randomInt } from 'crypto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';

@Injectable()
export class UsersService {
  private AVATAR_COLOR = [
    '2e2e2e',
    '868e96',
    'fa5252',
    'e64980',
    'be4bdb',
    '7950f2',
    '4c6ef5',
    '228be6',
    '15aabf',
    '12b886',
    '40c057',
    '82c91e',
    'fab005',
    'fd7e14',
  ];

  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(username: string, createUserDto: CreateUserDto): Promise<User> {
    const user = await this.findOne(username);
    if (user.rightRole != RightRole.Admin) {
      throw new ForbiddenException('没有权限创建用户');
    }
    const exists = await this.usersRepository.exists({
      where: {
        username: createUserDto.username,
      },
    });
    if (exists) {
      throw new ConflictException(`用户名为 ${createUserDto.username} 的用户已存在`);
    }
    if (!createUserDto.avatarOption) {
      createUserDto.avatarOption = { seed: nanoid(), color: this.randomAvatarColor() };
    }
    return await this.usersRepository.save(createUserDto);
  }

  async findAll(page: number, limit: number, where?: string, order?: string) {
    const whereOptions: FindOptionsWhere<User> = where ? JSON.parse(where) : {};
    const orderOptions: FindOptionsOrder<User> = order ? JSON.parse(order) : { createTime: 'DESC' };
    whereOptions.username = And(Not('admin'), Not('deleted'));
    const count = await this.usersRepository.count({
      where: whereOptions,
    });
    const pageList = await this.usersRepository.find({
      where: whereOptions,
      select: {
        username: true,
        realname: true,
        gender: true,
        studentId: true,
        className: true,
        rightRole: true,
        avatarOption: {
          seed: true,
          color: true,
        },
        actived: true,
        createTime: true,
        updateTime: true,
      },
      order: orderOptions,
      skip: limit * (page - 1),
      take: limit === 0 ? count : limit,
    });

    return { data: pageList, page: count == 0 ? 0 : page, limit: limit, count: count };
  }

  async findOne(username: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {
        username: username,
      },
    });
    if (!user) {
      throw new NotFoundException(`没有找到用户名为 ${username} 的用户`);
    }
    return user;
  }

  async getRightRole(username: string) {
    let user = await this.findOne(username);
    return user.rightRole;
  }

  async findProfile(username: string, findUsername: string): Promise<User> {
    let findUser: User = null;
    if (findUsername) {
      findUser = await this.findOne(findUsername);
    } else {
      findUser = await this.findOne(username);
    }
    return findUser;
  }

  async updateProfile(username: string, updateUsername: string, updateUserProfileDto: UpdateUserProfileDto) {
    let user = await this.findOne(username);
    let updateUser = null;
    if (updateUsername) {
      if (user.rightRole !== RightRole.Admin) {
        throw new ForbiddenException('没有权限修改该用户的信息');
      }
      updateUser = await this.findOne(updateUsername);
    } else {
      updateUser = user;
    }
    if (updateUserProfileDto.realname !== undefined) {
      updateUser.realname = updateUserProfileDto.realname;
    }
    if (updateUserProfileDto.gender !== undefined) {
      updateUser.gender = updateUserProfileDto.gender;
    }
    if (updateUserProfileDto.studentId !== undefined) {
      updateUser.studentId = updateUserProfileDto.studentId;
    }
    if (updateUserProfileDto.className !== undefined) {
      updateUser.className = updateUserProfileDto.className;
    }
    if (updateUserProfileDto.remark !== undefined) {
      updateUser.remark = updateUserProfileDto.remark;
    }
    if (updateUserProfileDto.actived !== undefined) {
      updateUser.actived = updateUserProfileDto.actived;
    }
    return await this.usersRepository.save(updateUser);
  }

  async updatePassword(username: string, updateUsername: string, updateUserPasswordDto: UpdateUserPasswordDto) {
    let user = await this.findOne(username);
    let updateUser = null;
    if (updateUsername) {
      if (user.rightRole !== RightRole.Admin) {
        throw new ForbiddenException('没有权限进行该操作');
      }
      updateUser = await this.findOne(updateUsername);
    } else {
      updateUser = user;
    }
    if (updateUserPasswordDto.oldPassword !== updateUser.password) {
      throw new ForbiddenException('旧密码验证失败');
    }
    updateUser.password = updateUserPasswordDto.newPassword;
    return await this.usersRepository.save(updateUser);
  }

  async resetPassword(username: string, updateUsername: string, resetUserPasswordDto: ResetUserPasswordDto) {
    let user = await this.findOne(username);
    let updateUser = null;
    if (updateUsername) {
      if (user.rightRole !== RightRole.Admin) {
        throw new ForbiddenException('没有权限进行该操作');
      }
      updateUser = await this.findOne(updateUsername);
    } else {
      updateUser = user;
    }
    updateUser.password = resetUserPasswordDto.password;
    return await this.usersRepository.save(updateUser);
  }

  async remove(username: string) {
    const user = await this.findOne(username);
    await this.usersRepository.remove(user);
    return undefined;
  }

  private randomAvatarColor(): string {
    return this.AVATAR_COLOR[randomInt(this.AVATAR_COLOR.length)];
  }
}
