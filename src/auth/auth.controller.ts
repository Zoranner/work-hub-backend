import { Controller, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Body, Req, Post } from '@nestjs/common';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('signin')
  signin(@Body() loginUserDto: LoginUserDto) {
    // this.logger.log(JSON.stringify(loginUserDto));
    return this.authService.signin(loginUserDto.username, loginUserDto.password);
  }

  @UseGuards(AuthGuard)
  @Post('signout')
  signout(@Req() request: any) {
    return this.authService.signout(request.user.username);
  }
}
