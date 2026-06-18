import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'tenant-subdomain' })
  @IsNotEmpty()
  subdomain!: string;

  @ApiProperty({ example: 'My Nepal Business Corp' })
  @IsNotEmpty()
  tenantName!: string;

  @ApiProperty({ example: 'owner@business.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123' })
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'First Owner Name' })
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '987654321', required: false })
  @IsOptional()
  panNumber?: string;
}
