import type { Request, Response, NextFunction } from 'express';
import { auth } from './firebase-admin';

export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Attach user to request
    req.user = {
      claims: {
        sub: decodedToken.uid,
        email: decodedToken.email,
      }
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
