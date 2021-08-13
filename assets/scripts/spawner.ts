import { _decorator, Component, resources, Prefab, Node, error, Vec3, instantiate, randomRange, tween, sp, Color, math, Rect, NodePool, Intersection2D, Vec2, Graphics, randomRangeInt } from 'cc';
import { Maze_PlayerCursor } from './playerCursor';
import { Maze_EnemyBase } from './enemyBase';
import { Maze_Common } from './common';
import { Maze_MapBuilder } from './map/mapBuilder';
import { Maze_Observer } from './observer/observer';
import std from './thirdparty/tstl/src';
const { ccclass, property } = _decorator;

@ccclass('Spawner')
export class Spawner extends Component 
{
    private static _enemyPoolMap:std.TreeMap<String, NodePool> = new std.TreeMap<String, NodePool>();

    private _destroyEnemyObserver:Maze_Observer.Observer<Maze_EnemyBase.DestroyEnemyContext> 
        = new Maze_Observer.Observer<Maze_EnemyBase.DestroyEnemyContext>();

    private _deathEnemyObserver:Maze_Observer.Observer<Maze_EnemyBase.DeathEnemyContext> 
        = new Maze_Observer.Observer<Maze_EnemyBase.DeathEnemyContext>();

    @property
    spawnDelaySec:number = 5;

    @property (Maze_PlayerCursor.PlayerCursor)
    player:Maze_PlayerCursor.PlayerCursor|null = null;

    @property
    innerBB:math.Rect = new Rect(-10, -10, 20, 20);

    @property
    outerBB:math.Rect = new Rect(-15, -15, 30, 30);

    @property (Maze_MapBuilder.MapBuilder)
    map:Maze_MapBuilder.MapBuilder|null = null;

    @property
    maxMonsterNumber:number = 30;

    @property (Graphics)
    private _sharedGraphics:Graphics|null = null;

    @property (Graphics)
    set SharedGraphics(val:Graphics|null)
    {
        this._sharedGraphics = val;
    }
    get SharedGraphics():Graphics|null
    {
        return this._sharedGraphics;
        }

    private _monster:Prefab|null = null;
    private _monsterLoaded:boolean = false;
    private _monsters : Set<Node> = new Set<Node>();

    private tryScheduleTimer()
    {
        var monstersLimitReached:boolean = this._monsters.size >= this.maxMonsterNumber;

        if(false == monstersLimitReached)
        {
            this.scheduleOnce(()=>
            {
                this.spawnMonster();
            },  this.spawnDelaySec);
        }
    }

    private createEnemy() : Node|null
    {
        var enemyInstance:Node|null = null;

        if(null != this._monster )
        {
            var nodePool:NodePool|null = null;

            if(Spawner._enemyPoolMap.has(this._monster.name))
            {
                nodePool = Spawner._enemyPoolMap.get(this._monster.name);
            }
            else
            {
                nodePool = new NodePool();
                Spawner._enemyPoolMap.set(this._monster.name,nodePool);
            }

            if(0 != nodePool.size())
            {
                enemyInstance = nodePool.get();

                if(null != enemyInstance)
                {
                    var enemyComponent = enemyInstance.getComponent( Maze_EnemyBase.EnemyBase );

                    if(null != enemyComponent)
                    {
                        enemyComponent.reuse();
                    }
                }
                else
                {
                    throw("Error! bulletInstance == null!");
                }
            }
            else
            {
                enemyInstance = instantiate(this._monster);
            }

            var enemyComponent = enemyInstance.getComponent( Maze_EnemyBase.EnemyBase );

            if(null != enemyComponent)
            {
                enemyComponent.deathEnemySubject.attach(this._deathEnemyObserver);
                enemyComponent.destroyEnemySubject.attach(this._destroyEnemyObserver);
            }
        }

        return enemyInstance;
    }

    private DestroyEnemy(enemy:Node)
    {
        if(null != this._monster)
        {
            var nodePool:NodePool|null = null;

            if(Spawner._enemyPoolMap.has(this._monster.name))
            {
                nodePool = Spawner._enemyPoolMap.get(this._monster.name);
            }
            else
            {
                nodePool = new NodePool();
                Spawner._enemyPoolMap.set(this._monster.name,nodePool);
            }

            var enemyComponent = enemy.getComponent( Maze_EnemyBase.EnemyBase );

            if(null != enemyComponent)
            {
                enemyComponent.deathEnemySubject.detach(this._deathEnemyObserver);
                enemyComponent.destroyEnemySubject.detach(this._destroyEnemyObserver);
            }

            nodePool.put(enemy);               
        }   
    }

    private spawnMonster()
    {
        var monsterInstance = this.createEnemy();

        if(null != monsterInstance)
        {
            this._monsters.add(monsterInstance);

            monsterInstance.parent = this.node;

            if(null != this.player)
            {
                var enemyBase = monsterInstance.getComponent(Maze_EnemyBase.EnemyBase);

                if(null != enemyBase && null != this.map)
                {
                    enemyBase.map = this.map;

                    enemyBase.playerInFocus = this.player;

                    var playerPositionWorldCoord = this.player.node.worldPosition;

                    var tileCoord: Vec2 = this.map.pointToTile(Maze_Common.toVec2( playerPositionWorldCoord ) );

                    var walkableTiles = this.map.filterTiles( new Rect( this.innerBB.x + tileCoord.x, this.innerBB.y + tileCoord.y, this.innerBB.width, this.innerBB.height ),
                                                                      new Rect( this.outerBB.x + tileCoord.x, this.outerBB.y + tileCoord.y, this.outerBB.width, this.outerBB.height ) );

                    var creationTileIndex = randomRangeInt(0, walkableTiles.length);
                    var creationTile = walkableTiles[creationTileIndex];

                    var creationPos:Vec2 = this.map.tileToPoint(creationTile);
                    monsterInstance.setWorldPosition(new Vec3(creationPos.x, creationPos.y, 0));

                    enemyBase.fadeIn();
                }
                else
                {
                    monsterInstance.setWorldPosition(new Vec3(100, 100, 0));
                }
            }
        }

        this.tryScheduleTimer();
    }

    onLoad()
    {
        resources.load('prefabs/enemies/SoldierEnemy', (err: Error | null, prefab:Prefab) => 
        {
            if(null == err)
            {
                this._monster = prefab;
            }
            else
            {
                error(err.message || err);
            }

            if(null != this._monster)
            {
                if(this.maxMonsterNumber != 0)
                {
                    this.spawnMonster();
                }
            }
        });

        this._deathEnemyObserver.setObserverCallback((data:Maze_EnemyBase.DeathEnemyContext) => 
        {
            var monstersLimitReached:boolean = this._monsters.size >= this.maxMonsterNumber;

            this._monsters.delete(data.enemy);

            if(true == monstersLimitReached)
            {
                this.spawnMonster();
            }
        });

        this._destroyEnemyObserver.setObserverCallback((data:Maze_EnemyBase.DestroyEnemyContext) => 
        {
            this.DestroyEnemy(data.enemy);
        });
    }

    start () 
    {
        
    }
}
