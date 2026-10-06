import os
from datetime import datetime, timedelta

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from domain.day_log.model import Day_Log
from domain.launch.model import Launch

SQUADRON_ID = "testvgs"


def reset_is_available() -> bool:
    return os.getenv("ENVIRONMENT", "").lower() in {"local", "preview"}


async def reset_testvgs(db: AsyncSession, operator_sn: str) -> dict[str, object]:
    if not reset_is_available():
        raise PermissionError("The development reset is unavailable in production")

    reset_day = datetime.now() - timedelta(days=1)
    winches = ((101, 315.6), (102, 285.1))
    launches = (("left", 3156), ("right", 3142))

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
        for drum, launch_number in launches:
            db.add(
                Launch(
                    squadron_id=SQUADRON_ID,
                    winch_id=winch_id,
                    drum=drum,
                    launch_number=launch_number,
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
