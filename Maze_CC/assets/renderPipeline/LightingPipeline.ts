import { _decorator, Component, Node, RenderPipeline } from "cc";
const { ccclass, property } = _decorator;

@ccclass("LightingPipeline")
export class LightingPipeline extends RenderPipeline {

    /* use `property` decorator if your want the member to be serializable */
    // @property
    // serializableDummy = 0;

    destroy () {
    }
}
