import { Injectable } from '@nestjs/common'
import { PrismaClientValidationError } from '@prisma/client/runtime/library'
import {
  PersistenceClientException,
  PersistenceInternalException,
} from '@sharedLibs/core/exception/storage.exception'

@Injectable()
export abstract class PrismaDefaultRepository {
  protected handleAndThrowError(error: unknown): never {
    const errorMessage = this.extractErrorMessage(error)
    if (error instanceof PrismaClientValidationError) {
      throw new PersistenceClientException(error.message)
    }

    throw new PersistenceInternalException(errorMessage)
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message
    }
    return 'An unexpected error occurred.'
  }
}
