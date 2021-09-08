using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Maze_EasyReference;
using Maze_BulletBase;
using Maze_Observer;
using UnityEngine.Pool;
using UnityTimer;

namespace Maze_WeaponBase
{
    public abstract class WeaponBase : MonoBehaviour
    {
        private static Dictionary<string, ObjectPool<GameObject>> sBulletPoolMap = new Dictionary<string, ObjectPool<GameObject>>();

        [SerializeField]
        private GameObject mBulletPrefab;
        public GameObject BulletPrefab { get => mBulletPrefab; set => mBulletPrefab = value; }

        [SerializeField]
        private float mFireRate = 1;
        public float FireRate { get => mFireRate; set => mFireRate = value; }

        [SerializeField]
        private float mBulletTimeAlive = 2;
        public float BulletTimeAlive { get => mBulletTimeAlive; set => mBulletTimeAlive = value; }

        [SerializeField]
        private float mBulletSpeed = 2;
        public float BulletSpeed { get => mBulletSpeed; set => mBulletSpeed = value; }

        [SerializeField]
        private int mDamage = 5;
        public int Damage { get => mDamage; set => mDamage = value; }

        [SerializeField]
        private int mLayer = 0;
        public int Layer { get => mLayer; set => mLayer = value; }

        protected Maze_EasyReference.EasyReference mEasyReference;
        private bool mFireOn = false;

        private bool mFireAllowed = true;
        public bool FireAllowed { get => mFireAllowed; }

        private Vector3 mDirection = new Vector3();
        public Vector3 Direction { get => mDirection; set => mDirection = value; }

        private Maze_Observer.Observer<Maze_BulletBase.DestroyBulletContext>  mDestroyBulletObserver = 
            new Maze_Observer.Observer<Maze_BulletBase.DestroyBulletContext>();

        private UnityTimer.Timer mTimer = null;

        private ObjectPool<GameObject> findOrCreateBulletsPool(string name)
        {
            ObjectPool<GameObject> objectsPool = null;

            if (false == WeaponBase.sBulletPoolMap.TryGetValue(name, out objectsPool))
            {
                objectsPool = new ObjectPool<GameObject>(
                createFunc: () => { return Instantiate(mBulletPrefab); },
                actionOnGet: (GameObject obj) =>
                {
                    var bulletComponent = obj.GetComponent<Maze_BulletBase.BulletBase>();
                    if (null != bulletComponent)
                    {
                        bulletComponent.reuse();
                        bulletComponent.DestroyBulletSubject.attach(mDestroyBulletObserver);
                    }

                    obj.SetActive(true);
                },
                actionOnRelease: (GameObject obj) =>
                {
                    var bulletComponent = obj.GetComponent<Maze_BulletBase.BulletBase>();
                    if (null != bulletComponent)
                    {
                        bulletComponent.DestroyBulletSubject.detach(mDestroyBulletObserver);
                    }

                    obj.SetActive(false);
                });
                WeaponBase.sBulletPoolMap.Add(name, objectsPool);
            }

            return objectsPool;
        }

        protected GameObject createBullet()
        {
            GameObject bulletInstance = null;

            if (null != mBulletPrefab)
            {
                ObjectPool<GameObject> objectsPool = findOrCreateBulletsPool(mBulletPrefab.name);

                if (null != objectsPool)
                {
                    bulletInstance = objectsPool.Get();
                }
                else
                {
                    throw new System.Exception("[WeaponBase::createBullet] Error! objectsPool == null!");
                }

                if (null == bulletInstance)
                {
                    throw new System.Exception("[WeaponBase::createBullet] Error! bulletInstance == null!");
                }
            }

            return bulletInstance;
        }

        protected void destroyBullet(GameObject bullet)
        {
            if (null != mBulletPrefab)
            {
                ObjectPool<GameObject> objectsPool = findOrCreateBulletsPool(mBulletPrefab.name);

                if (null != objectsPool)
                {
                    objectsPool.Release(bullet);
                }
                else
                {
                    throw new System.Exception("[WeaponBase::createBullet] Error! objectsPool == null!");
                }
            }
        }

        protected abstract void actualFire();

        private void scheduleFire()
        {
            if (true == mFireAllowed)
            {
                actualFire();
                mFireAllowed = false;

                mTimer = UnityTimer.Timer.Register(mFireRate, () =>
                {
                    if (true == mFireOn)
                    {
                        actualFire();
                    }

                    mFireAllowed = true;

                    if (true == mFireOn)
                    {
                        scheduleFire();
                    }
                });
            }
        }

        public void fireOn()
        {
            if (false == mFireOn)
            {
                mFireOn = true;
                scheduleFire();
            }
        }

        public void fireOff()
        {
            if (true == mFireOn)
            {
                mFireOn = false;
            }
        }

        // Start is called before the first frame update
        void Start()
        {
            mEasyReference = new Maze_EasyReference.EasyReference(gameObject);

            mDestroyBulletObserver.setObserverCallback((Maze_BulletBase.DestroyBulletContext data) => 
            {
                destroyBullet(data.Bullet);
            });
        }

        // Update is called once per frame
        void Update()
        {

        }
    }
}