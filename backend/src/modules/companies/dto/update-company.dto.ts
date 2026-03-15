import { IsOptional, IsString, IsUrl, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional() @IsString() name?: string;

  @ApiPropertyOptional({ example: 'Empresa de tecnología' })
  @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ example: 'Tecnología' })
  @IsOptional() @IsString() industry?: string;

  @ApiPropertyOptional({ example: '10-50' })
  @IsOptional() @IsString() size?: string;

  @ApiPropertyOptional({ example: 'https://acme.com' })
  @IsOptional() @IsUrl() website?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/...' })
  @IsOptional() @IsString() logoUrl?: string;

  @ApiPropertyOptional({ example: 'Lima, Perú' })
  @IsOptional() @IsString() location?: string;

  @ApiPropertyOptional({ example: '20123456789' })
  @IsOptional() @IsString() ruc?: string;

  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional() @IsString() contactPerson?: string;

  @ApiPropertyOptional({ example: 'Necesitamos digitalizar nuestro inventario' })
  @IsOptional() @IsString() painDescription?: string;

  @ApiPropertyOptional({ example: ['Transferencia', 'Yape'] })
  @IsOptional() @IsArray() paymentMethods?: string[];
}
