import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'empresa@ejemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: ['COMPANY', 'DEVELOPER'] })
  @IsEnum(['COMPANY', 'DEVELOPER'])
  role: 'COMPANY' | 'DEVELOPER';

  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MinLength(2)
  name: string;
}
