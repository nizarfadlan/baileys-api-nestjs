import { IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  page?: number;

  @IsOptional()
  @Type(() => String)
  @IsString()
  orderColumn?: string;

  @IsOptional()
  orderMethod?: 'asc' | 'desc';
}

export interface PaginationOptions {
  limit?: number;
  page?: number;
  orderColumn?: string;
  orderMethod?: 'asc' | 'desc';
}

export interface Pagination {
  total: number;
  currentPage: number;
  limit: number;
  nextPage?: number;
  prevPage?: number;
  firstPage?: number;
  lastPage?: number;
}

export interface ResponseWithPagination {
  readonly result: any[];
  readonly pagination: Pagination;
}
