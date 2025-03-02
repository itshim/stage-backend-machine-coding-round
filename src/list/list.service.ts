import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MyListDto } from './dto/create-users.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../models/user.schema';
import { Model } from 'mongoose';
import { Movie, MovieDocument } from '../models/movie.schema';
import { TVShow, TVShowDocument } from '../models/tvshow.schema';

@Injectable()
export class ListService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Movie.name) private readonly movieModel: Model<MovieDocument>,
    @InjectModel(TVShow.name)
    private readonly tvShowModel: Model<TVShowDocument>,
  ) {}

  /**
   * Fetches the user based on their email.
   * Ideally this should be in a separate service file because it is not related to a list
   * But for the sake of simplicity keep it here for now
   * @param {string} email - The user's email address.
   * @returns {Promise<string | null]>} - The user.
   */
  async fetchUser(email: string) {
    try {
      const user = this.userModel.findOne({ email });
      return user || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Fetches the user's list based on their email.
   * @param {string} email - The user's email address.
   * @returns {Promise<MyListDto[]>} - The user's list.
   */
  async fetchMyList(email: string) {
    return ((await this.userModel.findOne({ email }, { myList: 1 }).exec())
      ?.myList || []) as unknown as MyListDto[];
  }

  /**
   * Updates the user's my list section with the new / deleted items.
   * @param {string} email - The user's email address.
   * @param {MyListDto[]} myList - The list of items to update.
   * @returns {Promise<void>}
   */
  async updateMyList(email: string, myList: MyListDto[]) {
    this.userModel.updateOne({ email }, { myList }).exec();
  }

  /**
   * Adds an item to the user's list.
   * @param {string} email - The user's email address.
   * @param {MyListDto} createListDto - The item to add.
   * @throws {HttpException} - If the item already exists in the list.
   * @returns {Promise<void>}
   */
  async addToList(email: string, createListDto: MyListDto) {
    const myList = await this.fetchMyList(email);
    if (myList.find((n) => n.contentId === createListDto.contentId)) {
      throw new HttpException('Conflict', HttpStatus.CONFLICT);
    }
    myList.push(createListDto);
    await this.updateMyList(email, myList as MyListDto[]);
  }

  /**
   * Removes an item from the user's list.
   * @param {string} email - The user's email address.
   * @param {string} contentId - The ID of the content to remove.
   * @throws {HttpException} - If the item is not found in the list.
   * @returns {Promise<MyListDto>} - The removed item.
   */
  async removeFromList(email: string, contentId: string) {
    let myList = await this.fetchMyList(email);
    const matchedList = myList.find((n) => n.contentId === contentId);
    if (matchedList) {
      myList = myList.filter((n) => n.contentId !== contentId);
      await this.updateMyList(email, myList as MyListDto[]);
      return matchedList;
    }
    throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
  }

  /**
   * Paginates the user's list.
   * @param {object} params - The pagination parameters.
   * @param {MyListDto[]} params.myList - The user's list.
   * @param {number} params.pageNo - The page number.
   * @param {number} params.offset - The number of items per page.
   * @returns {MyListDto[]} - The paginated list.
   */
  handlePagination({
    myList,
    pageNo,
    offset,
  }: {
    myList: MyListDto[];
    pageNo: number;
    offset: number;
  }) {
    const startIndex =
      Number.isInteger(pageNo) && Number.isInteger(offset)
        ? (pageNo - 1) * offset
        : 0;
    const endIndex =
      Number.isInteger(pageNo) && Number.isInteger(offset)
        ? startIndex + offset
        : myList.length;
    return myList.slice(startIndex, endIndex);
  }

  /**
   * Searches and retrieves full data for the filtered list.
   * @param {object} params - The search parameters.
   * @param {MyListDto[]} params.myListFiltered - The filtered list.
   * @param {string} params.search - The search query.
   * @returns {Promise<MyListDto[]>} - The full data of the filtered list.
   */
  async handleSearchAndGetFullData({
    myListFiltered,
    search,
  }: {
    myListFiltered: MyListDto[];
    search: string;
  }) {
    const myListFilteredIds = myListFiltered.map((n) => n.contentId);
    const moviesList = myListFiltered.filter((n) => n.contentType === 'Movie');
    const tvShowList = myListFiltered.filter((n) => n.contentType === 'TVShow');
    const textSearch = search ? { $text: { $search: search } } : {};
    const moviesData = await this.movieModel.find(
      {
        _id: { $in: moviesList.map((n) => n.contentId) },
        ...textSearch,
      },
      { _id: 0 },
    );
    const tvShowData = await this.tvShowModel.find(
      {
        _id: { $in: tvShowList.map((n) => n.contentId) },
        ...textSearch,
      },
      { _id: 0 },
    );
    const combinedData = [...moviesData, ...tvShowData];

    return combinedData.sort((n) => myListFilteredIds.indexOf(n._id as string));
  }

  /**
   * Retrieves the user's list with pagination and search functionality.
   * @param {object} params - The parameters for listing items.
   * @param {string} params.email - The user's email address.
   * @param {number} params.pageNo - The page number.
   * @param {number} params.offset - The number of items per page.
   * @param {string} params.search - The search query.
   * @returns {Promise<MyListDto[]>} - The paginated and searched list.
   */
  async listMyItems({
    email,
    pageNo,
    offset,
    search,
  }: {
    email: string;
    pageNo: number;
    offset: number;
    search: string;
  }) {
    if (!(pageNo && offset) && !search) return [];
    const myList = await this.fetchMyList(email);
    const myListFiltered = this.handlePagination({ myList, pageNo, offset });
    return this.handleSearchAndGetFullData({ myListFiltered, search });
  }
}
