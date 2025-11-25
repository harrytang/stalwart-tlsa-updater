import KeyvRedis from "@keyv/redis";
import { HttpModule } from "@nestjs/axios";
import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import Keyv from "keyv";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
	imports: [
		HttpModule,
		ConfigModule.forRoot(),
		CacheModule.registerAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => {
				const keyvRedis = new KeyvRedis(
					configService.getOrThrow<string>("REDIS_URL"),
				);
				const keyv = new Keyv({ store: keyvRedis });
				return {
					stores: [keyv],
				};
			},
			inject: [ConfigService],
		}),
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
