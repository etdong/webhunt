import { KAPLAYCtx } from "kaplay";

/**
 * Update camera zoom depending on screen size. Useful for mobile.
 * @param k KAPLAY context
 */
export const updateCamZoom = (k: KAPLAYCtx) => {
    if (k.width() < 1000 || k.height() < 800) {
        k.setCamScale(0.5)
    } else {
        k.setCamScale(1)
    }
}

/**
 * Center camera on a position
 * @param k KAPLAY context
 * @param posVec2 Position to center camera on
 */
export const updateCamPos = (k: KAPLAYCtx, posVec2: any) => {
    k.tween(
        k.getCamPos(),
        posVec2,
        0.1,
        (newPos) => k.setCamPos(newPos),
        k.easings.linear
    )
}

/**
 * @param k KAPLAY context
 * @returns The relative mouse position from the center of the screen
 */
export const getRelativeMousePos = (k: KAPLAYCtx) => {
    return k.vec2(k.getCamPos().add((k.mousePos().x - k.center().x) / k.getCamScale().x, (k.mousePos().y - k.center().y) / k.getCamScale().y))
}

