import type { TransportMode } from '@/types';
import { haversineMinutes } from './geoUtils';

export async function etaMinutes(origin: [number, number], target: [number, number], mode: TransportMode): Promise<number> {
    try {
// TODO: заменить на реальный вызов Routing API Яндекс карт.
// Временный фолбек: геодезическое расстояние с усреднённой скоростью
        return haversineMinutes(origin, target, mode);
    } catch {
        return haversineMinutes(origin, target, mode);
    }
}