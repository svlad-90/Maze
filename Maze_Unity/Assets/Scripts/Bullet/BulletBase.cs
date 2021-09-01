using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Maze_Observer;
using Maze_Common;
using UnityTimer;

namespace Maze_BulletBase
{
    public class DestroyBulletContext
    {
        public DestroyBulletContext(GameObject bullet)
        {
            this.mBullet = bullet;
        }

        private GameObject mBullet;
        public GameObject Bullet { get => mBullet; set => mBullet = value; }
    }

    public class BulletBase : MonoBehaviour
    {
        private Maze_Observer.Subject<DestroyBulletContext> mDestroyBulletSubject = new Maze_Observer.Subject<DestroyBulletContext>();
        public Subject<DestroyBulletContext> DestroyBulletSubject { get => mDestroyBulletSubject; set => mDestroyBulletSubject = value; }

        private Vector2 mDirection = new Vector2();
        private bool mShouldDestroy = false;

        private bool mIsDamageActive = true;
        public bool IsDamageActive { get => mIsDamageActive; }

        private int mLayer = 0;
        public int Layer
        {
            get => mLayer;
            set
            {
                mLayer = value;
                this.gameObject.layer = value;

                if (null != mCircleCollider2D)
                {
                    mCircleCollider2D.enabled = false;
                    mCircleCollider2D.enabled = true;
                }
            }
        }

        private float mBulletTimeAlive = 2;
        public float BulletTimeAlive { get => mBulletTimeAlive; set => mBulletTimeAlive = value; }

        private float mBulletSpeed = 2;
        public float BulletSpeed { get => mBulletSpeed; set => mBulletSpeed = value; }

        private int mDamage = 2;
        public int Damage { get => mDamage; }

        private Timer mTimer;
        private CircleCollider2D mCircleCollider2D;
        private Rigidbody2D mRigidBody2D;

        public void deactivate()
        {
            this.mIsDamageActive = false;
        }

        public void reuse()
        {
            this.mIsDamageActive = true;
            this.mShouldDestroy = false;

            if(null != mTimer)
            {
                Timer.Cancel(mTimer);
            }
        }

        void OnCollisionEnter2D(Collision2D collision)
        {
            if (null != this.gameObject)
            {
                if (null != mRigidBody2D)
                {
                    mRigidBody2D.velocity = new Vector2(0, 0);
                    mRigidBody2D.angularVelocity = 0;
                }

                this.mShouldDestroy = true;
            }
        }

        public void fire(Vector3 startingPosWorldCoord, Vector2 direction, int damage)
        {
            this.mDamage = damage;

            var transform = this.gameObject.transform;

            if (null != transform)
            {
                transform.position = transform.InverseTransformPoint(startingPosWorldCoord);
            }

            this.mDirection = direction;

            mTimer = Timer.Register(mBulletTimeAlive, () =>
            {
                this.mShouldDestroy = true;
            });

            if (null != mRigidBody2D)
            {
                var movementVec = Common.clone(this.mDirection);
                movementVec.Normalize();

                if (mRigidBody2D.velocity.x < this.mBulletSpeed ||
                mRigidBody2D.velocity.x > -this.mBulletSpeed)
                {
                    movementVec.x *= this.mBulletSpeed;
                }

                if (mRigidBody2D.velocity.y < this.mBulletSpeed ||
                mRigidBody2D.velocity.y > -this.mBulletSpeed)
                {
                    movementVec.y *= this.mBulletSpeed;
                }

                mRigidBody2D.velocity = movementVec;
            }
        }

        // Start is called before the first frame update
        public void Awake()
        {
            mCircleCollider2D = this.gameObject.GetComponent<CircleCollider2D>();
            mRigidBody2D = this.gameObject.GetComponent<Rigidbody2D>();
        }

        public void Start()
        {
        }

        // Update is called once per frame
        public void Update()
        {
            if (null != this.gameObject)
            {
                if (true == this.mShouldDestroy)
                {
                    this.DestroyBulletSubject.notify(new DestroyBulletContext(this.gameObject));
                    this.mShouldDestroy = false;
                }
            }
        }
    }
}