import os
from datetime import datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.day_log.model import Day_Log
from domain.launch.model import Launch
from domain.squadron.model import Squadron
from domain.winch.model import Winch

SQUADRON_ID = "testvgs"


def reset_is_available() -> bool:
    return os.getenv("ENVIRONMENT", "").lower() in {"local", "preview", "test"}


async def reset_testvgs(db: AsyncSession, operator_sn: str) -> dict[str, object]:
    if not reset_is_available():
        raise PermissionError("The development reset is unavailable in production")

    reset_day = datetime.now() - timedelta(days=1)
    winches = ((101, 315.6), (102, 285.1))

    if await db.get(Squadron, SQUADRON_ID) is None:
        db.add(Squadron(id=SQUADRON_ID))
        await db.flush()

    for winch_id, _ in winches:
        winch = await db.get(Winch, winch_id)
        if winch is None:
            db.add(
                Winch(
                    id=winch_id,
                    registration=f"TEST-WINCH-{winch_id}",
                    squadron_id=SQUADRON_ID,
                )
            )
        elif winch.squadron_id != SQUADRON_ID:
            raise ValueError(f"Winch {winch_id} is not assigned to {SQUADRON_ID}")
    await db.flush()

    await db.execute(
        delete(Day_Log).where(
            Day_Log.squadron_id == SQUADRON_ID,
            Day_Log.winch_id.in_((101, 102)),
        )
    )
    await db.execute(
        delete(Launch).where(
            Launch.squadron_id == SQUADRON_ID,
            Launch.winch_id.in_((101, 102)),
        )
    )

    for winch_id, hours in winches:
        db.add(
            Day_Log(
                squadron_id=SQUADRON_ID,
                winch_id=winch_id,
                type="finish_day",
                timestamp=reset_day,
                operator_sn=operator_sn,
                hours=hours,
            )
        )
        for drum in ("left", "right"):
            db.add(
                Launch(
                    squadron_id=SQUADRON_ID,
                    winch_id=winch_id,
                    drum=drum,
                    launch_number=1,
                    timestamp=reset_day,
                    operator_sn=operator_sn,
                    remarks="development reset brought forward",
                )
            )

    await db.commit()
    return {
        "squadron_id": SQUADRON_ID,
        "winches_reset": 2,
        "finish_day": reset_day.date().isoformat(),
        "launches_created": 4,
    }
