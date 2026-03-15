import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RequestRevisionDto {
  @ApiPropertyOptional({ example: 'El diseño no coincide con los mockups' })
  @IsOptional() @IsString() reason?: string;
}
