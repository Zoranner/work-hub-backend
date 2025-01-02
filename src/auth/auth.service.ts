import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ServerConfig } from 'src/configs/server.config';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    // @Inject(forwardRef(()=> ClerksService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signin(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new NotFoundException(`没有找到用户名为 ${username} 的用户`);
    }
    if (user.password !== password) {
      throw new UnauthorizedException('用户名和密码组合认证失败');
    }
    let payload = {
      username: user.username,
    };
    return {
      token: this.jwtService.sign(payload),
      expiresIn: ServerConfig.session.expireTime,
    };
  }

  async signout(_username: string) {
    return undefined;
  }
}
