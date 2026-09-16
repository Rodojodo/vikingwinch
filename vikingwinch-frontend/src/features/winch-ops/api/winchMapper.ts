import type {WinchRead} from '../types/api';
import type {Winch} from '../types/domain';

export const toWinch = (dto: WinchRead): Winch => ({
    id: dto.id,
    registration: dto.registration ?? dto.name ?? '',
    squadronId: dto.squadron_id,
});
