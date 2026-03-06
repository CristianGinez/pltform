import { IsOptional, IsString, IsUrl, IsArray } from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsString() size?: string;
  @IsOptional() @IsUrl()    website?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() ruc?: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() painDescription?: string;
  @IsOptional() @IsArray()  paymentMethods?: string[];
}
