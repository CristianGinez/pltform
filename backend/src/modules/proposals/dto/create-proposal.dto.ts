import { IsString, IsNumber, Min, MinLength, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MilestonePlanItemDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  order: number;
}

export class CreateProposalDto {
  @ApiProperty({ example: 'Tengo 5 años de experiencia en proyectos similares...' })
  @IsString()
  @MinLength(100)
  coverLetter: string;

  @ApiProperty({ example: 4500 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  budget: number;

  @ApiProperty({ description: 'Días estimados para completar', example: 30 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  timeline: number;

  @ApiPropertyOptional({ description: 'Plan de milestones propuesto por el developer', type: [MilestonePlanItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestonePlanItemDto)
  milestonePlan?: MilestonePlanItemDto[];
}
