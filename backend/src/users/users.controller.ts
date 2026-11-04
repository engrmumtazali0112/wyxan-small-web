import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // GET /api/users : the list behind the "who is browsing?" picker
  @Get()
  findAll() {
    return this.users.findAll();
  }

  // GET /api/users/:id : lets the frontend restore the chosen person on reload
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findById(id);
  }
}
