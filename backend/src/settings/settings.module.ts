import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SiteSetting } from './site-setting.entity'
import { SettingsService } from './settings.service'

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SiteSetting])],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
