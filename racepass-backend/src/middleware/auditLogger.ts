import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AuthRequest } from './auth';

// ─── Audit Logger Middleware ─────────────────────────────────
// Logs sensitive operations to the audit_logs table.
// Never logs PII — only action metadata.

export const auditLog = (action: string, resourceType?: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        const startTime = Date.now();

        // Use the 'finish' event instead of overriding res.end
        res.on('finish', () => {
            const duration = Date.now() - startTime;

            logAuditEntry({
                userId: req.user?.userId || null,
                action,
                resourceType: resourceType || null,
                resourceId: (req.params?.id as string) || null,
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent')?.substring(0, 512) || null,
                details: {
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode,
                    duration,
                },
            }).catch(() => {
                // Silently fail — audit logging should never break the request
            });
        });

        next();
    };
};

// ─── Direct audit log function ───────────────────────────────

interface AuditEntry {
    userId: string | null;
    action: string;
    resourceType: string | null;
    resourceId: string | null;
    ipAddress: string;
    userAgent: string | null;
    details: Record<string, any>;
}

export const logAuditEntry = async (entry: AuditEntry): Promise<void> => {
    try {
        await query(
            `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                entry.userId,
                entry.action,
                entry.resourceType,
                entry.resourceId,
                entry.ipAddress,
                entry.userAgent,
                JSON.stringify(entry.details),
            ]
        );
    } catch {
        // Silently fail
    }
};
