import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as oauthClientService from './oauth-client.service';

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const clients = await oauthClientService.listClients(req.user.userId);
        res.json(clients);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const get = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const client = await oauthClientService.getClient(req.params.id as string, req.user.userId);
        res.json(client);
    } catch (err: any) {
        const status = err.message.includes('not found') ? 404 : 500;
        res.status(status).json({ error: err.message });
    }
};

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { name, redirectUris, scopes, grantTypes, skipConsent } = req.body;
        if (!name || !redirectUris || !Array.isArray(redirectUris) || redirectUris.length === 0) {
            res.status(400).json({ error: 'name and redirectUris (array) are required' });
            return;
        }
        const client = await oauthClientService.createClient(req.user.userId, {
            name,
            redirectUris,
            scopes,
            grantTypes,
            skipConsent,
        });
        res.status(201).json(client);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const client = await oauthClientService.updateClient(
            req.params.id as string,
            req.user.userId,
            req.body
        );
        res.json(client);
    } catch (err: any) {
        const status = err.message.includes('not found') ? 404 : 500;
        res.status(status).json({ error: err.message });
    }
};

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const result = await oauthClientService.deleteClient(req.params.id as string, req.user.userId);
        res.json({ message: 'Client deleted', ...result });
    } catch (err: any) {
        const status = err.message.includes('not found') ? 404 : 500;
        res.status(status).json({ error: err.message });
    }
};

export const rotateSecret = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const result = await oauthClientService.rotateSecret(req.params.id as string, req.user.userId);
        res.json(result);
    } catch (err: any) {
        const status = err.message.includes('not found') ? 404 : 500;
        res.status(status).json({ error: err.message });
    }
};
