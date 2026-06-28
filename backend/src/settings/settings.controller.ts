import {
  Controller, Get, Patch, Body, Param, UseGuards, Req, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../entities/setting.entity';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('settings')
@UseGuards(JwtGuard)
export class SettingsController {
  constructor(
    @InjectRepository(SystemSetting) private readonly settingRepo: Repository<SystemSetting>,
  ) {}

  /** GET /settings — all system settings */
  @Get()
  async getAllSettings(@Req() req: any) {
    const { role } = req.user;
    if (!['admin', 'super_admin', 'librarian'].includes(role)) {
      throw new ForbiddenException('Only administrators and librarians can view settings');
    }
    return this.settingRepo.find({ order: { key: 'ASC' } });
  }

  /** PATCH /settings/:key — update a setting value */
  @Patch(':key')
  async updateSetting(@Param('key') key: string, @Body() body: { value: string }, @Req() req: any) {
    const { role } = req.user;
    if (!['admin', 'super_admin'].includes(role)) {
      throw new ForbiddenException('Only administrators can modify system settings');
    }

    if (!body.value && body.value !== '0') {
      throw new NotFoundException('value is required');
    }

    const setting = await this.settingRepo.findOne({ where: { key } });
    if (!setting) throw new NotFoundException(`Setting '${key}' not found`);

    setting.value = body.value;
    return this.settingRepo.save(setting);
  }
}
