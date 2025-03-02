import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsDate,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ContentType {
  MOVIE = 'Movie',
  TVSHOW = 'TVShow',
}

export class WatchUserDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  contentId: string;

  @ApiProperty({ type: Date })
  @IsNotEmpty()
  @IsDate()
  watchedOn: Date;

  @ApiProperty({ type: Number })
  @IsNumber()
  rating: number;
}

export class MyListDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  contentId: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsEnum(ContentType)
  contentType: ContentType;
}

export class CreateUsersDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  favoriteGenres: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  dislikedGenres: string[];

  @ApiProperty({ type: [WatchUserDto] })
  @IsArray()
  watchHistory: WatchUserDto[];

  @ApiProperty({ type: [MyListDto] })
  @IsArray()
  myList: MyListDto[];
}
