import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { Request } from "express";

@Injectable()
export class ApiGuard implements CanActivate {
	constructor(private readonly configService: ConfigService) {}
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<Request>();
		const apiKeyHeader = request.header("x-api-key");
		const validApiKey = this.configService.getOrThrow<string>("API_KEY");

		if (apiKeyHeader !== validApiKey) {
			throw new UnauthorizedException("Invalid API key");
		}

		return true;
	}
}
