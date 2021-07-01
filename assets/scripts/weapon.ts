
import { _decorator, Component, Node, Vec3, Scheduler, Prefab, instantiate, Vec2, misc, UITransform } from 'cc';
import { Maze_BulletBase } from './bulletBase';
import { Maze_GlobalMouseListener } from './globalMouseListener';
import { Maze_EasyReference } from './easyReference';
const { ccclass, property } = _decorator;

export namespace Maze_Weapon
{ 
    @ccclass('Weapon')
    export class Weapon extends Component 
    {
        @property
        bulletPrefab:Prefab = new Prefab();

        @property
        fireRate:number = 1;

        @property
        bulletTimeAlive:number = 2;

        @property
        bulletSpeed:number = 2;

        private easyReference:Maze_EasyReference.EasyReference|null = null;

        private _fireOn:boolean = false;
        private _fireAllowed:boolean = true;

        private _direction:Vec3 = new Vec3();
        public set direction(val:Vec3)
        {
            this._direction = val;
        }
        public get direction() : Vec3
        {
            return this._direction;
        }

        private actualFire()
        {
            var bullet = instantiate(this.bulletPrefab);

            if(null != bullet)
            {
                bullet.parent = this.node.parent;

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
                                    bulletComponent.fire(bulletUITransform.convertToWorldSpaceAR(this.node.position), bulletFlyingVec);
                                }
                            }
                        }
                    }
                }
            }
        }

        private scheduleFire()
        {
            if(true == this._fireAllowed)
            {
                this.actualFire();
                this._fireAllowed = false;

                this.scheduleOnce(()=> 
                {
                    if(true == this._fireOn)
                    {
                        this.actualFire();
                    }

                    this._fireAllowed = true;
                    
                    if(true == this._fireOn)
                    {
                        this.scheduleFire();
                    }
                }, this.fireRate);
            }
        }

        public fireOn()
        {
            if(false == this._fireOn)
            {
                this._fireOn = true;
                this.scheduleFire();
            }
        }

        public fireOff()
        {
            if(true == this._fireOn)
            {
                this._fireOn = false;
            }
        }

        public onLoad ()
        {
            this.node.addComponent(Maze_GlobalMouseListener.GlobalMouseListener);
            this.node.addComponent(Maze_EasyReference.EasyReference);

            this.easyReference = this.node.getComponent(Maze_EasyReference.EasyReference);
        }

        public start() 
        {
        }
    }
}