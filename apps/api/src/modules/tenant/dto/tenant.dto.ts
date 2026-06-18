import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Levithon Labs Corp. Nepal' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '987654321' })
  @IsString()
  @IsNotEmpty()
  panNumber!: string;

  @ApiProperty({ example: 'finance@levithon.com', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: '+977-1-4433221', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Patan, Lalitpur, Nepal', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateSettingDto {
  @ApiProperty({ example: 'sparrow-sms-key-xyz' })
  @IsString()
  @IsNotEmpty()
  value!: string;
}

export class CreateTenantUserDto {
  @ApiProperty({ example: 'Shyam Thapa' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'shyam@everest.com.np' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SALES_REPRESENTATIVE' })
  @IsString()
  @IsNotEmpty()
  role!: string;
}

