import ApplicationError from '@/application/core/errors/ApplicationError';
import DomainError from '@/domain/core/errors/DomainError';
import InfrastructureError from '@/infrastructure/core/errors/InfrastructureError';
import { Request, Response, NextFunction } from 'express';

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {

    // log error type and stack trace
    console.log(typeof err);
    console.error("Error:", err.stack);

    if (err instanceof DomainError || err instanceof InfrastructureError || err instanceof ApplicationError) {
        res.status(err.statusCode).json({ message: err.message });
        return;
    }

    res.status(500).json({ message: 'Internal Server Error' });
    return
};

export default errorHandler;