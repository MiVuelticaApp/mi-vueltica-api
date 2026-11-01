import ApplicationError from '@/application/core/errors/ApplicationError';
import DomainError from '@/domain/core/errors/DomainError';
import InfrastructureError from '@/infrastructure/core/errors/InfrastructureError';
import { mapPrismaError } from './prismaErrorMapper';
import { Request, Response, NextFunction } from 'express';

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {

    const prismaError = mapPrismaError(err);
    if (prismaError) {
        res.status(prismaError.status).json({ message: prismaError.message });
        return;
    }

    if (err instanceof DomainError || err instanceof InfrastructureError || err instanceof ApplicationError) {
        if (err.statusCode >= 500) console.error("Error:", err.stack);
        res.status(err.statusCode).json({ message: err.message });
        return;
    }

    console.error("Unhandled error:", err.stack);

    res.status(500).json({ message: 'Internal Server Error' });
    return
};

export default errorHandler;