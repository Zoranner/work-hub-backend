import {
  Controller,
  Body,
  UseGuards,
  Query,
  Get,
  ClassSerializerInterceptor,
  UseInterceptors,
  Logger,
  Req,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ValidateLimitPipe, ValidatePagePipe } from 'src/utils/pipe/list-page.pipe';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard)
  @Post('create')
  create(@Req() request: any, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(request.user.username, createUserDto);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard)
  @Get('list')
  findAll(
    @Query('page', ValidatePagePipe) page: number,
    @Query('limit', ValidateLimitPipe) limit: number,
    @Query('where') where?: string,
    @Query('order') order?: string,
  ) {
    return this.usersService.findAll(page, limit, where, order);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard)
  @Get('profile')
  findProfile(@Req() request: any, @Query('username') findUsername: string) {
    return this.usersService.findProfile(request.user.username, findUsername);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard)
  @Post('update-profile')
  updateProfile(
    @Req() request: any,
    @Query('username') updateUsername: string,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    return this.usersService.updateProfile(request.user.username, updateUsername, updateUserProfileDto);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard)
  @Post('update-password')
  updatePassword(
    @Req() request: any,
    @Query('username') updateUsername: string,
    @Body() updateUserPasswordDto: UpdateUserPasswordDto,
  ) {
    return this.usersService.updatePassword(request.user.username, updateUsername, updateUserPasswordDto);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard)
  @Post('reset-password')
  resetPassword(
    @Req() request: any,
    @Query('username') updateUsername: string,
    @Body() resetUserPasswordDto: ResetUserPasswordDto,
  ) {
    return this.usersService.resetPassword(request.user.username, updateUsername, resetUserPasswordDto);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard)
  @Post('remove')
  remove(@Query('username') username: string) {
    return this.usersService.remove(username);
  }
}
