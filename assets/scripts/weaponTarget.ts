
import { _decorator, Vec2, UITransform, Node } from 'cc';
import { Maze_WeaponBase } from './weaponBase'
import { Maze_BulletBase } from './bulletBase';
const { ccclass, property } = _decorator;

export namespace Maze_WeaponTarget
{

    @ccclass('WeaponTarget')
    export class WeaponTarget extends Maze_WeaponBase.WeaponBase 
    {
        private _target:Node = new Node();
        public get target() : Node
        {
            return this._target;
        }
        public set target(val:Node)
        {
            this._target = val;
        }

        protected actualFire()
        {
            var bullet = this.createBullet();

            if(null != bullet)
            {
                bullet.parent = this.node.parent;

                var bulletComponent = bullet.getComponent(Maze_BulletBase.BulletBase);

                if(null != bulletComponent)
                {
                    bulletComponent.bulletTimeAlive = this.bulletTimeAlive;
                    bulletComponent.bulletSpeed = this.bulletSpeed;

                    if(null != this._target)
                    {
                        var targetPosWorldCoord = this._target.worldPosition;
                        var nodeWorldCoord = this.node.getWorldPosition();

                        var bulletFlyingVec:Vec2 = new Vec2();

                        bulletFlyingVec.x = targetPosWorldCoord.x - nodeWorldCoord.x;
                        bulletFlyingVec.y = targetPosWorldCoord.y - nodeWorldCoord.y;

                        bulletFlyingVec.normalize();

                        var bulletUITransform = bullet.getComponent(UITransform);

                        if(null != bulletUITransform)
                        {
                            bulletComponent.fire(bulletUITransform.convertToWorldSpaceAR(this.node.position), bulletFlyingVec, this.damage);
                        }
                    }
                }
            }
        }
    }

}