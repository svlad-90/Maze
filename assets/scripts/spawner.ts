import { _decorator, Component, resources, Prefab, Node, error, Vec3, instantiate, randomRange, tween, sp, Color, math, Rect, Intersection2D, Vec2, Graphics, randomRangeInt } from 'cc';
import { Maze_PlayerCursor } from './playerCursor';
import { Maze_EnemyBase } from './enemyBase';
import { Maze_Common } from './common';
import { Maze_MapBuilder } from './map/mapBuilder';
const { ccclass, property } = _decorator;

@ccclass('Spawner')
export class Spawner extends Component 
{
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

    private onMonsterDead(node:Node)
    {
        var monstersLimitReached:boolean = this._monsters.size >= this.maxMonsterNumber;

        this._monsters.delete(node);

        if(true == monstersLimitReached)
        {
            this.spawnMonster();
        }
    }

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

    private spawnMonster()
    {
        var monsterInstance = instantiate( this._monster as Prefab );

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
                    enemyBase.addDeathNotificationCallback(this.onMonsterDead.bind(this));

                    enemyBase.playerInFocus = this.player;

                    var playerPositionWorldCoord = this.player.node.worldPosition;

                    var tileCoord: Vec2 = this.map.pointToTile(Maze_Common.toVec2( playerPositionWorldCoord ) );

                    var walkableTiles = this.map.filterWalkableTiles( new Rect( this.innerBB.x + tileCoord.x, this.innerBB.y + tileCoord.y, this.innerBB.width, this.innerBB.height ),
                                                                      new Rect( this.outerBB.x + tileCoord.x, this.outerBB.y + tileCoord.y, this.outerBB.width, this.outerBB.height ) );

                    var creationTileIndex = randomRangeInt(0, walkableTiles.length);
                    var creationTile = walkableTiles[creationTileIndex];

                    var creationPos:Vec2 = this.map.tileToPoint(creationTile);
                    monsterInstance.setWorldPosition(new Vec3(creationPos.x, creationPos.y, 0));
                }
                else
                {
                    monsterInstance.setWorldPosition(new Vec3(100, 100, 0));
                }

                var spineComp = monsterInstance.getComponent( sp.Skeleton );

                if(null != spineComp)
                {
                    spineComp.color.set(new Color(spineComp.color.r, spineComp.color.g, spineComp.color.b, 0));
                    tween(spineComp.color).to(2, new Color(spineComp.color.r, spineComp.color.g, spineComp.color.b, 255)).start();
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
    }

    start () 
    {
        
    }
}
