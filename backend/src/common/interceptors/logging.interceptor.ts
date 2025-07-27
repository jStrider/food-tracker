import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const userAgent = req.get("User-Agent") || "";
    const userId = req.user?.id || "anonymous";

    const now = Date.now();

    this.logger.log(`🔄 ${method} ${url} - User: ${userId} - ${userAgent}`);

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(
          `✅ ${method} ${url} - ${responseTime}ms - User: ${userId}`,
        );
      }),
    );
  }
}
