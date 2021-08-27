
import { _decorator, Component, Node, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

export namespace Maze_ILIghtingSource
{
    export interface ILightingSource
    {
        isVisible():boolean;
        worldPosition():Vec2;
        hasVisiblePolygonChanged():boolean;
        getVisiblePolygon():[number,number][];
    }
}