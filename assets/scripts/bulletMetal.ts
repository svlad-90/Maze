import { _decorator, Component, Node, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
import { Maze_BulletBase } from './bulletBase';

export namespace Maze_BulletMetal
{ 
    @ccclass('BulletMetal')
    export class BulletMetal extends Maze_BulletBase.BulletBase
    {
        public onLoad ()
        {
            super.onLoad();
        }

        public start() 
        {
            super.start();
        }
    }
}