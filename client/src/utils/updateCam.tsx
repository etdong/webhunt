import { KAPLAYCtx } from "kaplay";

export const updateCamZoom = (k: KAPLAYCtx) => {
    if (k.width() < 750 || k.height() < 800) {
        k.setCamScale(0.5)
    } else {
        k.setCamScale(1)
    }
}

export const updateCamPos = (k: KAPLAYCtx, posVec2: any) => {
    k.tween(
        k.getCamPos(),
        posVec2,
        0.1,
        (newPos) => k.setCamPos(newPos),
        k.easings.linear
    )
}

