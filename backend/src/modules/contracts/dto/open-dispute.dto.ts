import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OpenDisputeDto {
  @ApiProperty({ example: 'El developer no ha entregado en 3 semanas', minLength: 10 })
  @IsString() @MinLength(10) reason: string;
}
