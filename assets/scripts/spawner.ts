import { _decorator, Component, resources, Prefab, Node, error, Vec3, instantiate, randomRange, tween, sp, Color, math, Rect, Intersection2D, Vec2 } from 'cc';
import { Maze_PlayerCursor } from './playerCursor';
import { Maze_EnemyBase } from './enemyBase';
import { Maze_Common } from './common';
const { ccclass, property } = _decorator;

@ccclass('Spawner')
export class Spawner extends Component 
{
    @property
    spawnDelaySec:number = 5;

    @property (Maze_PlayerCursor.PlayerCursor)
    player:Maze_PlayerCursor.PlayerCursor|null = null;

    @property
    innerBB:math.Rect = new Rect(-500, -500, 1000, 1000);

    @property
    outerBB:math.Rect = new Rect(-250, -250, 500, 500);

    @property
    maxMonsterNumber:number = 100;

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

                if(null != enemyBase)
                {
                    enemyBase.addDeathNotificationCallback(this.onMonsterDead.bind(this));

                    enemyBase.playerInFocus = this.player;

                    var playerPositionWorldCoord = this.player.node.worldPosition;

                    var creationPos:Vec2 = new Vec2( randomRange(this.outerBB.xMin, this.outerBB.xMax), 
                                                     randomRange(this.outerBB.yMin, this.outerBB.yMax));

                    var checkIntersectionVec:Vec2 = new Vec2();
                    
                    Vec2.subtract(checkIntersectionVec, creationPos, this.innerBB.center);
                    checkIntersectionVec.normalize().multiply(new Vec2(this.outerBB.xMax * 10, this.outerBB.yMax * 10));

                    type tPointsPair = 
                    {
                        vec1: Vec2;
                        vec2: Vec2;
                    };

                    var rectEdges:tPointsPair[] = [];

                    var leftEdge:tPointsPair = { vec1 : new Vec2(this.innerBB.xMin, this.innerBB.yMin), vec2 : new Vec2(this.innerBB.xMin, this.innerBB.yMax) };
                    rectEdges.push(leftEdge);
                    var topEdge:tPointsPair = { vec1 : new Vec2(this.innerBB.xMin, this.innerBB.yMax), vec2 : new Vec2(this.innerBB.xMax, this.innerBB.yMax) };
                    rectEdges.push(topEdge);
                    var rightEdge:tPointsPair = { vec1 : new Vec2(this.innerBB.xMax, this.innerBB.yMax), vec2 : new Vec2(this.innerBB.xMax, this.innerBB.yMin) };
                    rectEdges.push(rightEdge);
                    var bottomEdge:tPointsPair = { vec1 : new Vec2(this.innerBB.xMax, this.innerBB.yMin), vec2 : new Vec2(this.innerBB.xMin, this.innerBB.yMin) };
                    rectEdges.push(bottomEdge);

                    var creationVec:Vec2|null = null;

                    for(var element of rectEdges) 
                    {
                        var line1:Maze_Common.Line = new Maze_Common.Line( element.vec1, element.vec2 );
                        var line2:Maze_Common.Line = new Maze_Common.Line( this.innerBB.center, checkIntersectionVec );

                        var intersectionPoint = Maze_Common.linesCross( line1, line2 );

                        if(null != intersectionPoint)
                        {
                            creationVec = intersectionPoint;
                            break;
                        }
                    }

                    if(null != creationVec)
                    {
                        creationVec.add(Maze_Common.toVec2( this.player.node.worldPosition ) );
                        monsterInstance.setWorldPosition(new Vec3(creationVec.x, creationVec.y, 0));
                    }
                    else
                    {
                        monsterInstance.setWorldPosition(new Vec3(100, 100, 0));
                    }
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
