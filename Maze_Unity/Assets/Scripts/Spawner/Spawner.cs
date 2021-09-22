using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Pool;
using UnityTimer;
using Maze_PlayerCursor;
using Maze_EnemyBase;
using Maze_Common;
using Maze_MapBuilder;
using Maze_Observer;


namespace Maze_Spawner
{
    public class Spawner : MonoBehaviour
    {
        private Dictionary<String, ObjectPool<GameObject>> mGameObjectPoolMap = new Dictionary<String, ObjectPool<GameObject>>();

        private Observer<Maze_EnemyBase.DestroyEnemyContext>  mDestroyEnemyObserver = new Observer<DestroyEnemyContext>();
        private Observer<Maze_EnemyBase.DeathEnemyContext> mDeathEnemyObserver = new Maze_Observer.Observer<DeathEnemyContext>();

        [SerializeField]
        float mSpawnDelaySec = 5;
        public float SpawnDelaySec { get => mSpawnDelaySec; set => mSpawnDelaySec = value; }

        [SerializeField]
        PlayerCursor mPlayer = null;
        public PlayerCursor Player { get => mPlayer; set => mPlayer = value; }

        [SerializeField]
        int mMinCellDistance = 5;
        public int MinCellDistance { get => mMinCellDistance; set => mMinCellDistance = value; }

        [SerializeField]
        int mMaxCellDistance = 10;
        public int MaxCellDistance { get => mMaxCellDistance; set => mMaxCellDistance = value; }

        [SerializeField]
        MapBuilder mMap = null;
        public MapBuilder Map { get => mMap; set => mMap = value; }

        [SerializeField]
        float mMaxMonsterNumber = 30;
        public float MaxMonsterNumber { get => mMaxMonsterNumber; set => mMaxMonsterNumber = value; }

        private GameObject mMonster = null;
        private HashSet<GameObject> mMonsters = new HashSet<GameObject>();
        private Timer mSpawnDelayTimer;

        private void spawnMonster()
        {
            var monsterInstance = createEnemy();

            if (null != monsterInstance)
            {
                mMonsters.Add(monsterInstance);
            }

            tryScheduleTimer();
        }

        private void tryScheduleTimer()
        {
            bool monstersLimitReached = mMonsters.Count >= mMaxMonsterNumber;

            if (false == monstersLimitReached)
            {
                mSpawnDelayTimer = Timer.Register( mSpawnDelaySec, () =>
                {
                    spawnMonster();
                });
            }
        }

        private ObjectPool<GameObject> findOrCreateEnemiesPool(string name)
        {
            ObjectPool<GameObject> objectsPool = null;

            if (false == mGameObjectPoolMap.TryGetValue(name, out objectsPool))
            {
                objectsPool = new ObjectPool<GameObject>(
                createFunc: () => { return Instantiate(mMonster); },
                actionOnGet: (GameObject obj) =>
                {
                    if (null != mPlayer)
                    {
                        obj.transform.SetParent(transform);

                        var enemyBase = obj.GetComponent<Maze_EnemyBase.EnemyBase>();

                        if (null != enemyBase && null != mMap)
                        {
                            enemyBase.Map = mMap;

                            enemyBase.PlayerInFocus = mPlayer;

                            var playerPositionWorldCoord = mPlayer.transform.position;

                            var tileCoord = mMap.pointToWalkableTile(Common.toVec2(playerPositionWorldCoord));

                            var walkableTiles = mMap.getReachableCells(tileCoord, mMinCellDistance, mMaxCellDistance);

                            var creationTile = new Vector2Int();

                            if (0 != walkableTiles.Count)
                            {
                                var creationTileIndex = Common.randomRangeInt(0, walkableTiles.Count);
                                creationTile = walkableTiles[creationTileIndex];
                            }
                            else
                            {
                                creationTile = tileCoord;
                            }

                            var creationPos = mMap.tileToPoint(creationTile);
                            obj.transform.position = new Vector3(creationPos.x, creationPos.y, 0);
                        }
                        else
                        {
                            obj.transform.position = new Vector3(100, 100, 0);
                        }

                        enemyBase.reuse();
                        enemyBase.DeathEnemySubject.attach(mDeathEnemyObserver);
                        enemyBase.DestroyEnemySubject.attach(mDestroyEnemyObserver);
                    }

                    obj.SetActive(true);
                },
                actionOnRelease: (GameObject obj) =>
                {
                    var enemyComponent = obj.GetComponent<EnemyBase>();

                    if (null != enemyComponent)
                    {
                        enemyComponent.DeathEnemySubject.detach(mDeathEnemyObserver);
                        enemyComponent.DestroyEnemySubject.detach(mDestroyEnemyObserver);
                    }

                    obj.SetActive(false);
                });
                mGameObjectPoolMap.Add(name, objectsPool);
            }

            return objectsPool;
        }

        private GameObject createEnemy()
        {
            GameObject enemyInstance = null;

            if (null != mMonster)
            {
                ObjectPool<GameObject> objectsPool = findOrCreateEnemiesPool(mMonster.name);

                if (null != objectsPool)
                {
                    enemyInstance = objectsPool.Get();
                }
                else
                {
                    throw new System.Exception("[Spawner][createEnemy] Error! objectsPool == null!");
                }

                if (null == enemyInstance)
                {
                    throw new System.Exception("[Spawner][createEnemy] Error! enemyInstance == null!");
                }
            }

            return enemyInstance;
        }

        private void DestroyEnemy(GameObject enemy)
        {
            if (null != mMonster)
            {
                ObjectPool < GameObject > objectsPool = findOrCreateEnemiesPool(mMonster.name);

                if (null != objectsPool)
                {
                    objectsPool.Release(enemy);
                }
                else
                {
                    throw new System.Exception("[Spawner][createBullet] Error! objectsPool == null!");
                }
            }
        }

        void Awake()
        {
            mMonster = Resources.Load<GameObject>("Enemy/Enemy");
        }

        void Start()
        {
            if (null != mMonster)
            {
                if (mMaxMonsterNumber != 0)
                {
                    spawnMonster();
                }
            }

            mDeathEnemyObserver.setObserverCallback((DeathEnemyContext data) =>
            {
                bool monstersLimitReached = mMonsters.Count >= mMaxMonsterNumber;

                mMonsters.Remove(data.Enemy);

                if (true == monstersLimitReached)
                {
                    spawnMonster();
                }
            });

            mDestroyEnemyObserver.setObserverCallback((Maze_EnemyBase.DestroyEnemyContext data) =>
            {
                DestroyEnemy(data.Enemy);
            });
        }
    }
}
