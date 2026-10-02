import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ExportInquiry } from './entities/export-inquiry.entity'
import { ExportInquiryController } from './export-inquiry.controller'
import { ExportInquiryService } from './export-inquiry.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([ExportInquiry]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [ExportInquiryController],
  providers: [ExportInquiryService],
  exports: [ExportInquiryService],
})
export class ExportImportModule {}
