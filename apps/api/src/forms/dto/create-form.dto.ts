import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FieldType } from '@prisma/client';
 
export class CreateFieldDto {
  @IsString()
  @IsNotEmpty()
  label: string;
  @IsString()
  type: FieldType;

  @IsOptional()
  required?: boolean;

  @IsOptional()
  @IsArray()
  options?: string[];
}

export class CreateFormDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldDto)
  fields: CreateFieldDto[];
}
