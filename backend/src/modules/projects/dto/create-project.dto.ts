import { IsString, IsOptional, IsNumber, IsArray, IsDateString, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProjectDto {
  @ApiProperty({ example: 'App móvil para gestión de inventario' })
  @IsString()
  @MinLength(10)
  title: string;

  @ApiProperty({ example: 'Necesitamos una app iOS/Android para...' })
  @IsString()
  @MinLength(50)
  description: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(100)
  @Type(() => Number)
  budget: number;

  @ApiProperty({ required: false, example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiProperty({ required: false, example: ['React Native', 'Node.js'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({ required: false, example: 'Mobile' })
  @IsOptional()
  @IsString()
  category?: string;
}
