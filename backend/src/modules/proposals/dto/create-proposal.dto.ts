import { IsString, IsNumber, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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
}
