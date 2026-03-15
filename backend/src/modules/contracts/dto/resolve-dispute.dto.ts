import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveDisputeDto {
  @ApiProperty({ enum: ['dev_wins', 'company_wins', 'mutual'] })
  @IsEnum(['dev_wins', 'company_wins', 'mutual']) outcome: 'dev_wins' | 'company_wins' | 'mutual';

  @ApiPropertyOptional({ example: 'El developer entregó el trabajo según los requisitos' })
  @IsOptional() @IsString() adminComment?: string;
}
