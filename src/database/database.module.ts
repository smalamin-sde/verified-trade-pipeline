import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'allchrono'),
        password: configService.get<string>(
          'DATABASE_PASSWORD',
          'allchrono_dev',
        ),
        database: configService.get<string>('DATABASE_NAME', 'allchrono'),
        autoLoadEntities: true,
        synchronize: false,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
