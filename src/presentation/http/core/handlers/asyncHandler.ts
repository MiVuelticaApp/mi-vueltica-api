import { Request, Response, NextFunction } from 'express';

interface AsyncHandlerFunction {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req: Request, res: Response, next: NextFunction): Promise<any>;
}

interface AsyncHandler {
    (fn: AsyncHandlerFunction): (req: Request, res: Response, next: NextFunction) => void;
}

const asyncHandler: AsyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
export default asyncHandler;