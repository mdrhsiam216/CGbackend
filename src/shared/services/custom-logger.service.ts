import { Injectable, Logger } from '@nestjs/common';
import { ILogger } from '../interfaces/logger.interface';

@Injectable()
export class CustomLogger extends Logger implements ILogger {
  log(tag: string, message: string, context?: any): void {
    const logMessage = context
      ? `${message} - ${JSON.stringify(context)}`
      : message;
    super.log(`[${tag}] ${logMessage}`);
  }

  error(tag: string, message: string, error?: any): void {
    let errorMessage = message;
    if (error) {
      if (error instanceof Error) {
        errorMessage = `${message} - ${error.message}${error.stack ? `\n${error.stack}` : ''}`;
      } else if (typeof error === 'object') {
        // Serialize object to JSON for better readability
        try {
          errorMessage = `${message} - ${JSON.stringify(error, null, 2)}`;
        } catch {
          errorMessage = `${message} - ${String(error)}`;
        }
      } else {
        errorMessage = `${message} - ${String(error)}`;
      }
    }
    super.error(`[${tag}] ${errorMessage}`);
  }

  warn(tag: string, message: string, context?: any): void {
    const warnMessage = context
      ? `${message} - ${JSON.stringify(context)}`
      : message;
    super.warn(`[${tag}] ${warnMessage}`);
  }

  debug(tag: string, message: string, context?: any): void {
    const debugMessage = context
      ? `${message} - ${JSON.stringify(context)}`
      : message;
    super.debug(`[${tag}] ${debugMessage}`);
  }

  verbose(tag: string, message: string, context?: any): void {
    const verboseMessage = context
      ? `${message} - ${JSON.stringify(context)}`
      : message;
    super.verbose(`[${tag}] ${verboseMessage}`);
  }
}
