
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

export namespace Maze_ILIghtingSource
{
    export interface ILightingSource
    {
        isVisible():boolean;
        hasVisiblePolygonChanged():boolean;
        getVisiblePolygon():[number,number][];
    }
}