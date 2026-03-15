import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RespondProposalDto {
  @ApiProperty({ enum: ['accept', 'reject', 'counter'] })
  @IsEnum(['accept', 'reject', 'counter']) response: 'accept' | 'reject' | 'counter';

  @ApiPropertyOptional({ example: 'Sugiero cambiar el plazo a 45 días' })
  @IsOptional() @IsString() counter?: string;
}
