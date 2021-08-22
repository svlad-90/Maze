
import { _decorator, Component, Vec3, Prefab, instantiate, Node, NodePool } from 'cc';
import { Maze_GlobalMouseListener } from './globalMouseListener';
import { Maze_EasyReference } from './easyReference';
import { Maze_BulletBase } from './bulletBase';
import { Maze_Observer } from './observer/observer';
import std from './thirdparty/tstl/src';
const { property } = _decorator;

export namespace Maze_WeaponBase
{ 
    export abstract class WeaponBase extends Component 
    {
        private static _bulletPoolMap:std.TreeMap<String, NodePool> = new std.TreeMap<String, NodePool>();

        @property (Prefab)
        bulletPrefab:Prefab|null = null;

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

        private _destroyBulletObserver:Maze_Observer.Observer<Maze_BulletBase.DestroyBulletContext> 
        = new Maze_Observer.Observer<Maze_BulletBase.DestroyBulletContext>();

        protected createBullet() : Node|null
        {
            var bulletInstance:Node|null = null;

            if(null != this.bulletPrefab)
            {
                var nodePool:NodePool|null = null;

                if(WeaponBase._bulletPoolMap.has(this.bulletPrefab.name))
                {
                    nodePool = WeaponBase._bulletPoolMap.get(this.bulletPrefab.name);
                }
                else
                {
                    nodePool = new NodePool();
                    WeaponBase._bulletPoolMap.set(this.bulletPrefab.name,nodePool);
                }

                if(0 != nodePool.size())
                {
                    bulletInstance = nodePool.get();

                    if(null != bulletInstance)
                    {
                        var bulletComponent = bulletInstance.getComponent( Maze_BulletBase.BulletBase );
        
                        if(null != bulletComponent)
                        {
                            bulletComponent.reuse();
                        }
                    }
                    else
                    {
                        throw("Error! bulletInstance == null!");
                    }
                }
                else
                {
                    bulletInstance = instantiate(this.bulletPrefab);
                }                
            }
            
            if(null != bulletInstance)
            {
                var bulletComponent = bulletInstance.getComponent( Maze_BulletBase.BulletBase );

                if(null != bulletComponent)
                {
                    bulletComponent.collisionGroup = this.bulletCollisionGroup;
                    bulletComponent.destroyBulletSubject.attach(this._destroyBulletObserver);
                }
            }
            else
            {
                throw("Error! bulletInstance == null!");
            }

            return bulletInstance;
        }

        protected destroyBullet(bullet:Node)
        {
            if(null != this.bulletPrefab)
            {
                var nodePool:NodePool|null = null;

                if(WeaponBase._bulletPoolMap.has(this.bulletPrefab.name))
                {
                    nodePool = WeaponBase._bulletPoolMap.get(this.bulletPrefab.name);
                }
                else
                {
                    nodePool = new NodePool();
                    WeaponBase._bulletPoolMap.set(this.bulletPrefab.name,nodePool);
                }

                var bulletComponent = bullet.getComponent( Maze_BulletBase.BulletBase );

                if(null != bulletComponent)
                {
                    bulletComponent.destroyBulletSubject.detach(this._destroyBulletObserver);
                }

                nodePool.put(bullet);               
            }   
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

        public start() 
        {
            this.node.addComponent(Maze_GlobalMouseListener.GlobalMouseListener);

            this.easyReference = new Maze_EasyReference.EasyReference(this.node);

            this._destroyBulletObserver.setObserverCallback((data:Maze_BulletBase.DestroyBulletContext) => 
            {                
                this.destroyBullet(data.bullet);
            });
        }
    }
}