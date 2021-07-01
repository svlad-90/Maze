
import { _decorator, Component, Vec3, Prefab, instantiate } from 'cc';
import { Maze_GlobalMouseListener } from './globalMouseListener';
import { Maze_EasyReference } from './easyReference';
import { Maze_BulletBase } from './bulletBase';
const { property } = _decorator;

export namespace Maze_WeaponBase
{ 
    export abstract class WeaponBase extends Component 
    {
        @property (Prefab)
        bulletPrefab:Prefab = new Prefab();

        @property
        fireRate:number = 1;

        @property
        bulletTimeAlive:number = 2;

        @property
        bulletSpeed:number = 2;

        @property
        damage:number = 5;

        @property
        bulletCollisionGroup:number = 0;

        protected easyReference:Maze_EasyReference.EasyReference|null = null;

        private _fireOn:boolean = false;

        private _fireAllowed:boolean = true;
        public get fireAllowed() : boolean
        {
            return this._fireAllowed;
        }

        private _direction:Vec3 = new Vec3();
        public set direction(val:Vec3)
        {
            this._direction = val;
        }
        public get direction() : Vec3
        {
            return this._direction;
        }

        createBullet()
        {
            var bulletPrefab = instantiate(this.bulletPrefab);
            
            if(null != bulletPrefab)
            {
                var bulletComponent = bulletPrefab.getComponent( Maze_BulletBase.BulletBase );

                if(null != bulletComponent)
                {
                    bulletComponent.collisionGroup = this.bulletCollisionGroup;
                }
            }
            
            return bulletPrefab;
        }

        // should be implemented by inhetired classes
        protected abstract actualFire() : void;

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