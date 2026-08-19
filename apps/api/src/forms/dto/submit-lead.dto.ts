import { IsObject, IsNotEmpty } from 'class-validator';

export class SubmitLeadDto {
  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;
}
