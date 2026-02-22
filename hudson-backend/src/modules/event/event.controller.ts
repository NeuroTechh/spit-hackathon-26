import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as eventService from './event.service';

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Auth required' }); return; }
        const event = await eventService.createEvent(req.user.userId, req.body);
        res.status(201).json(event);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
};

export const listEvents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const status = req.query.status as string | undefined;
        const events = await eventService.listEvents(status);
        res.json({ events });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const event = await eventService.getEvent(req.params.id as string);
        res.json(event);
    } catch (err: any) { res.status(404).json({ error: err.message }); }
};

export const checkEligibility = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Auth required' }); return; }
        const result = await eventService.checkEligibility(req.user.userId, req.params.id as string);
        res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
};

export const mintPass = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Auth required' }); return; }
        const pass = await eventService.mintEventPass(req.user.userId, req.user.walletAddress, req.params.id as string);
        res.status(201).json(pass);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
};

export const getMyPasses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Auth required' }); return; }
        const passes = await eventService.getUserPasses(req.user.userId);
        res.json({ passes });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const checkIn = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Auth required' }); return; }
        const result = await eventService.checkInPass(req.params.passId as string, req.user.userId);
        res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
};
