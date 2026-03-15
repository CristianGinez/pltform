import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitMilestoneDto {
  @ApiPropertyOptional({ example: 'Diseño completado' })
  @IsOptional() @IsString() deliveryNote?: string;

  @ApiPropertyOptional({ example: 'https://figma.com/design-v1' })
  @IsOptional() @IsString() deliveryLink?: string;
}
