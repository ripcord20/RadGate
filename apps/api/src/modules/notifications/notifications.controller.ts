import { Controller, Get, Param, Post } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @RequirePermission('notifications', 'view')
  list() {
    return this.notifications.list();
  }

  @Post(':id/read')
  @RequirePermission('notifications', 'update')
  markRead(@Param('id') id: string) {
    return this.notifications.markRead(id);
  }
}
