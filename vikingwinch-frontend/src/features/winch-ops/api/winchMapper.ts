import type {WinchRead, WinchStatusRead} from '../types/api';
import type {Winch, WinchWithStatus} from '../types/domain';

export const toWinch = (dto: WinchRead): Winch => ({
    id: dto.id,
    registration: dto.registration ?? dto.name ?? '',
    squadronId: dto.squadron_id,
});

export const toWinchWithStatus = (dto: WinchStatusRead): WinchWithStatus => ({
    ...toWinch(dto),
    status: dto.status,
});
