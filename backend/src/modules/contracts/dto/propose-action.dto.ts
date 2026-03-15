import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProposeActionDto {
  @ApiProperty({ enum: ['PROPOSE_START', 'PROPOSE_SUBMIT', 'PROPOSE_REVISION', 'PROPOSE_APPROVE', 'PROPOSE_CANCEL', 'PROPOSE_MILESTONE_PLAN'] })
  @IsString() action: string;

  @ApiPropertyOptional() @IsOptional() @IsString() deliveryNote?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() deliveryLink?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}
