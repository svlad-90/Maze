import { _decorator, Component, resources, Prefab, Node, error, Vec3, instantiate, randomRange, tween, sp, color, Color } from 'cc';
import { Maze_PlayerCursor } from './playerCursor';
import { Maze_EnemyBase } from './enemyBase';
const { ccclass, property } = _decorator;

@ccclass('Spawner')
export class Spawner extends Component 
{
    @property
    spawnDelaySec:number = 5;

    @property (Maze_PlayerCursor.PlayerCursor)
    player:Maze_PlayerCursor.PlayerCursor|null = null;

    private _monster:Prefab|null = null;
    private _monsterLoaded:boolean = false;

    private spawnMonster()
    {
        var monsterInstance = instantiate( this._monster as Prefab );

        if(null != monsterInstance)
        {
            monsterInstance.parent = this.node;

            if(null != this.player)
            {
                var enemyBase = monsterInstance.getComponent(Maze_EnemyBase.EnemyBase);

                if(null != enemyBase)
                {
                    enemyBase.playerInFocus = this.player;

                    var playerPositionWorldCoord = this.player.node.worldPosition;

                    var x:number = playerPositionWorldCoord.x + randomRange(-500, 500);
                    var y:number = playerPositionWorldCoord.y + randomRange(-500, 500);

                    monsterInstance.setWorldPosition(new Vec3(x, y, 0));
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

        this.scheduleOnce(()=>
        {
            this.spawnMonster();
        },  this.spawnDelaySec);
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
                this.spawnMonster();
            }
        });

        
    }

    start () 
    {

    }
}
