import { IsEmail, IsEnum, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'empresa@ejemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula y 1 número',
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'La contraseña debe incluir al menos una mayúscula, una minúscula y un número',
  })
  password: string;

  @ApiProperty({ enum: ['COMPANY', 'DEVELOPER'] })
  @IsEnum(['COMPANY', 'DEVELOPER'])
  role: 'COMPANY' | 'DEVELOPER';

  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MinLength(2)
  name: string;
}
