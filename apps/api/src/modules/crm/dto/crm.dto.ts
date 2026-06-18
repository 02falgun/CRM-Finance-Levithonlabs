import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Nepal Traders Ltd.' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '601234567', required: false })
  @IsOptional()
  @IsString()
  panNumber?: string;
}

export class UpdateCustomerDto {
  @ApiProperty({ example: 'Nepal Traders Revised Ltd.' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '601234567', required: false })
  @IsOptional()
  @IsString()
  panNumber?: string;
}

export class DeactivateCustomerDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  isActive!: boolean;
}

export class CreateCustomerContactDto {
  @ApiProperty({ example: 'Shyam Thapa' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'shyam@nepaltraders.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+977-9851098765', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Finance Head', required: false })
  @IsOptional()
  @IsString()
  role?: string;
}

export class CreateLeadDto {
  @ApiProperty({ example: 'Enterprise CRM Setup' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Customer wants complete cloud migration support.', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 45000 })
  @IsNumber()
  value!: number;

  @ApiProperty({ example: 'customer-uuid-here', required: false })
  @IsOptional()
  @IsString()
  customerId?: string;
}

export class CreateLeadActivityDto {
  @ApiProperty({ example: 'CALL' })
  @IsString()
  @IsNotEmpty()
  type!: string; // CALL, EMAIL, MEETING, NOTE

  @ApiProperty({ example: 'Followed up on proposal. Customer asked to call back next week.' })
  @IsString()
  @IsNotEmpty()
  note!: string;
}

export class UpdateLeadStatusDto {
  @ApiProperty({ example: 'Negotiation' }) // New, Contacted, Proposal Sent, Negotiation, Converted, Lost
  @IsString()
  @IsNotEmpty()
  status!: string;
}
