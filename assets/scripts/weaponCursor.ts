import { _decorator, Vec2, UITransform } from 'cc';
import { Maze_WeaponBase } from './weaponBase'
import { Maze_BulletBase } from './bulletBase';
import { Maze_GlobalMouseListener } from './globalMouseListener';
const { ccclass, property } = _decorator;

export namespace Maze_WeaponCursor
{
    @ccclass('WeaponCursor')
    export class WeaponCursor extends Maze_WeaponBase.WeaponBase 
    {
        protected actualFire()
        {
            var bullet = this.createBullet();

            if(null != bullet)
            {
                bullet.parent = this.node.parent;

                if(null != this.node.parent)
                {
                    this.node.parent.addChild(bullet);
                }

                var bulletComponent = bullet.getComponent(Maze_BulletBase.BulletBase);

                if(null != bulletComponent)
                {
                    bulletComponent.bulletTimeAlive = this.bulletTimeAlive;
                    bulletComponent.bulletSpeed = this.bulletSpeed;

                    if(null != this.easyReference)
                    {
                        var globalMouseListener = this.getComponent(Maze_GlobalMouseListener.GlobalMouseListener);

                        if(null != globalMouseListener)
                        {
                            if(null != this.easyReference.camera)
                            {
                                var mousePosWorldCoord = this.easyReference.camera.screenToWorld( globalMouseListener.mousePos );
                                var nodeWorldCoord = this.node.getWorldPosition();

                                var bulletFlyingVec:Vec2 = new Vec2();

                                bulletFlyingVec.x = mousePosWorldCoord.x - nodeWorldCoord.x;
                                bulletFlyingVec.y = mousePosWorldCoord.y - nodeWorldCoord.y;

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
    }

}