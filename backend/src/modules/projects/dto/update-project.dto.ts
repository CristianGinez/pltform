import { IsString, IsOptional, IsNumber, IsArray, IsDateString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Rediseño de plataforma web', minLength: 10 })
  @IsOptional()
  @IsString()
  @MinLength(10)
  title?: string;

  @ApiPropertyOptional({ example: 'Necesitamos rediseñar nuestra plataforma...', minLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(50)
  description?: string;

  @ApiPropertyOptional({ example: 1500, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  budget?: number;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ example: ['React', 'Node.js'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: 'E-commerce' })
  @IsOptional()
  @IsString()
  category?: string;
}
