import { Controller, Get, Post, Body, Delete, Query } from '@nestjs/common';
import { ListService } from './list.service';
import { ApiTags } from '@nestjs/swagger';
import { MyListDto } from './dto/create-users.dto';
import { User } from 'src/decorators/user.decorator';

@ApiTags('Lists')
@Controller('list')
export class ListController {
  constructor(private readonly listService: ListService) {}

  @Get()
  async findAll(
    @User() email: string,
    @Query('page') pageNo: number,
    @Query('offset') offset: number,
    @Query('search') search: string,
  ) {
    return this.listService.listMyItems({
      email,
      pageNo,
      offset,
      search,
    });
  }

  @Post()
  async create(@User() email: string, @Body() createListDto: MyListDto) {
    return this.listService.addToList(email, createListDto);
  }

  @Delete()
  async delete(@User() email: string, @Body('contentId') contentId: string) {
    return this.listService.removeFromList(email, contentId);
  }
}
