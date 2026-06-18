import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, ValidateNested, Min, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemInputDto {
  @ApiProperty({ example: 'item descriptions' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiProperty({ example: 'tax-rate-uuid-here', required: false })
  @IsOptional()
  @IsString()
  taxId?: string;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 'customer-uuid-here' })
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({ type: [InvoiceItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemInputDto)
  items!: InvoiceItemInputDto[];

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  discount?: number;
}

export class CreateCreditNoteDto {
  @ApiProperty({ example: 'Goods returned by client' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class CreateQuotationDto {
  @ApiProperty({ example: 'customer-uuid-here' })
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({ example: '2026-07-31T23:59:59Z' })
  @IsDateString()
  validUntil!: string;

  @ApiProperty({ type: [InvoiceItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemInputDto)
  items!: InvoiceItemInputDto[];
}

export class CreatePaymentDto {
  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: 'ESEWA' })
  @IsString()
  @IsNotEmpty()
  paymentMode!: string; // CASH, ESEWA, KHALTI, BANK_TRANSFER

  @ApiProperty({ example: 'REF123456', required: false })
  @IsOptional()
  @IsString()
  referenceNo?: string;
}

export class CreateTaxDto {
  @ApiProperty({ example: 'VAT 13%' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 13.00 })
  @IsNumber()
  rate!: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isExempt?: boolean;
}
